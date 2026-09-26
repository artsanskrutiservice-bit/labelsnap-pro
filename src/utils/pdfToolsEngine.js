import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

/**
 * 1. Merge Multiple PDFs into One Single Document
 * @param {Array<Uint8Array|ArrayBuffer>} pdfBytesList - Array of PDF byte arrays
 * @returns {Promise<Uint8Array>} - Merged PDF bytes
 */
export async function mergePdfFiles(pdfBytesList) {
  if (!pdfBytesList || pdfBytesList.length === 0) {
    throw new Error('Please provide at least one PDF file to merge.');
  }

  const mergedPdf = await PDFDocument.create();

  for (const bytes of pdfBytesList) {
    const srcDoc = await PDFDocument.load(bytes);
    const copiedPages = await mergedPdf.copyPages(srcDoc, srcDoc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Helper to parse range string like "1-3, 5, 8-10" into 0-based page indices
 * @param {string} rangeStr - Range format e.g. "1-3, 5"
 * @param {number} totalPages - Total pages count in PDF
 * @returns {Array<number>} - Array of 0-based unique page indices
 */
export function parsePageRangeString(rangeStr, totalPages) {
  if (!rangeStr || !rangeStr.trim()) return [];

  const indices = new Set();
  const parts = rangeStr.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);

      if (!isNaN(start) && !isNaN(end)) {
        const min = Math.max(1, Math.min(start, end));
        const max = Math.min(totalPages, Math.max(start, end));
        for (let i = min; i <= max; i++) {
          indices.add(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        indices.add(pageNum - 1);
      }
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * 2. Split PDF by Specified Page Range String (e.g., "1-2, 4")
 * @param {Uint8Array|ArrayBuffer} pdfBytes - Source PDF bytes
 * @param {string} rangeStr - E.g. "1-3, 5"
 * @returns {Promise<Uint8Array>} - Extracted pages as new PDF
 */
export async function splitPdfByRange(pdfBytes, rangeStr) {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();
  const targetIndices = parsePageRangeString(rangeStr, totalPages);

  if (targetIndices.length === 0) {
    throw new Error('No valid pages found in the specified range.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, targetIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * 3. Extract Every Page as a Separate Single-Page PDF
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @returns {Promise<Array<{pageNumber: number, bytes: Uint8Array}>>}
 */
export async function splitAllPagesIndividually(pdfBytes) {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();
  const results = [];

  for (let i = 0; i < totalPages; i++) {
    const singleDoc = await PDFDocument.create();
    const [copiedPage] = await singleDoc.copyPages(srcDoc, [i]);
    singleDoc.addPage(copiedPage);
    const bytes = await singleDoc.save();
    results.push({ pageNumber: i + 1, bytes });
  }

  return results;
}

/**
 * 4. Rotate PDF Pages
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @param {number|Object} rotation - Single rotation angle (90, 180, 270) OR map: { [pageIndex]: angle }
 * @returns {Promise<Uint8Array>}
 */
export async function rotatePdfPages(pdfBytes, rotation) {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();

  pages.forEach((page, index) => {
    let addAngle = 0;
    if (typeof rotation === 'number') {
      addAngle = rotation;
    } else if (typeof rotation === 'object' && rotation[index] !== undefined) {
      addAngle = rotation[index];
    }

    if (addAngle !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + addAngle) % 360));
    }
  });

  return await doc.save();
}

/**
 * 5. Remove / Delete Selected Pages
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @param {Array<number>} pageIndicesToRemove - 0-based page indices to remove
 * @returns {Promise<Uint8Array>}
 */
export async function removePdfPages(pdfBytes, pageIndicesToRemove) {
  const srcDoc = await PDFDocument.load(pdfBytes);
  const totalPages = srcDoc.getPageCount();
  const removeSet = new Set(pageIndicesToRemove);

  const keepIndices = [];
  for (let i = 0; i < totalPages; i++) {
    if (!removeSet.has(i)) {
      keepIndices.push(i);
    }
  }

  if (keepIndices.length === 0) {
    throw new Error('Cannot delete all pages. At least one page must remain.');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, keepIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * 6. Custom Box Crop for PDF Pages
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @param {Object} cropBox - { x, y, width, height } in PDF points or ratio
 * @param {Array<number>|null} targetPages - Specific 0-based page indices (null means all pages)
 * @returns {Promise<Uint8Array>}
 */
export async function cropPdfCustom(pdfBytes, cropBox, targetPages = null) {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const targetSet = targetPages ? new Set(targetPages) : null;

  pages.forEach((page, idx) => {
    if (!targetSet || targetSet.has(idx)) {
      const { width: origWidth, height: origHeight } = page.getSize();

      // Support for percentage-based box [0 to 1] or absolute points
      const isRatio = cropBox.width <= 1 && cropBox.height <= 1;

      const cropX = isRatio ? cropBox.x * origWidth : cropBox.x;
      const cropY = isRatio ? cropBox.y * origHeight : cropBox.y;
      const cropW = isRatio ? cropBox.width * origWidth : cropBox.width;
      const cropH = isRatio ? cropBox.height * origHeight : cropBox.height;

      page.setCropBox(cropX, cropY, cropW, cropH);
    }
  });

  return await doc.save();
}

/**
 * 7. Add Page Numbers to PDF (e.g. "Page 1 of 5" at Bottom-Center)
 * @param {Uint8Array|ArrayBuffer} pdfBytes
 * @param {Object} options - { position: 'bottom-center'|'bottom-right', fontSize: 10, startFrom: 1 }
 * @returns {Promise<Uint8Array>}
 */
export async function addPageNumbers(pdfBytes, options = {}) {
  const {
    position = 'bottom-center',
    fontSize = 10,
    startFrom = 1
  } = options;

  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const total = doc.getPageCount();

  for (let i = 0; i < total; i++) {
    const page = doc.getPage(i);
    const { width } = page.getSize();
    const text = `Page ${i + startFrom} of ${total}`;
    const textWidth = font.widthOfTextAtSize(text, fontSize);

    let x = (width - textWidth) / 2; // default: bottom-center
    if (position === 'bottom-right') {
      x = width - textWidth - 30;
    } else if (position === 'bottom-left') {
      x = 30;
    }

    const y = 20; // 20 points from bottom

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(0.2, 0.2, 0.2),
    });
  }

  return await doc.save();
}