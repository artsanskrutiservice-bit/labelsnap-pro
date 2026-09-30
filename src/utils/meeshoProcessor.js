import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MM = 72 / 25.4;
const A4 = { w: 595.28, h: 841.89 };

// Meesho Thermal Format Coordinates
const MEESHO_BOTTOM_EXTRA = 2 * MM;
const MEESHO_OUTPUT = { w: 595, h: 348.2 + MEESHO_BOTTOM_EXTRA };
const MEESHO_CROP = {
  x: 0,
  y: 0,
  w: 595,
  h: 348.2 + MEESHO_BOTTOM_EXTRA,
};

// ✅ FIXED: Tight Crop for "Keep Invoice" — no left cut, no bottom white space
const INVOICE_TIGHT_CROP = { x: 0, y: 5, w: 595, h: 615 };

// 1. Meesho Style Code and Size Extractor
async function extractMeeshoItemDetails(pdfjsDoc, pageNum) {
  try {
    const page = await pdfjsDoc.getPage(pageNum);
    const tc = await page.getTextContent();
    const items = tc.items.map((x) => (x.str || '').trim()).filter(Boolean);
    const text = items.join(' ');

    let styleCode = '';
    let size = '';

    const styleMatch = text.match(/(?:SKU|Style\s*(?:Code|Id)?)\s*[:\-]?\s*([A-Za-z0-9_\-]+)/i);
    if (styleMatch && styleMatch[1]) styleCode = styleMatch[1].trim();

    const sizeMatch = text.match(/(?:Size)\s*[:\-]?\s*(Free|[XSLM0-9]+)/i);
    if (sizeMatch && sizeMatch[1]) size = sizeMatch[1].trim();

    return {
      styleCode: styleCode || 'N/A',
      size: size || ''
    };
  } catch (e) {
    return { styleCode: 'N/A', size: '' };
  }
}

// 2. Meesho Live Preview
export async function renderMeeshoPreview(inputBytes, canvas, options = {}) {
  const { darkenThermal = false, processingMode = 'label_only' } = options;
  const loading = pdfjsLib.getDocument({ data: inputBytes.slice() });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const scale = 1.6;
  const vp = page.getViewport({ scale });

  let activeCrop;
  if (processingMode === 'keep_invoice') {
    activeCrop = INVOICE_TIGHT_CROP;
  } else if (processingMode === 'single_page') {
    activeCrop = { x: 0, y: 0, w: A4.w, h: A4.h };
  } else {
    activeCrop = MEESHO_CROP;
  }

  const sx = activeCrop.x * scale, sy = activeCrop.y * scale;
  const sw = activeCrop.w * scale, sh = activeCrop.h * scale;

  const full = document.createElement('canvas');
  full.width = Math.ceil(vp.width);
  full.height = Math.ceil(vp.height);
  await page.render({ canvasContext: full.getContext('2d'), viewport: vp }).promise;

  canvas.width = Math.ceil(sw);
  canvas.height = Math.ceil(sh);
  const ctx = canvas.getContext('2d');

  if (darkenThermal) {
    ctx.filter = 'contrast(140%) brightness(95%)';
  } else {
    ctx.filter = 'none';
  }

  ctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
}

// 3. Meesho Label Processing Engine
export async function processMeeshoLabels(inputBytes, onProgress, options = {}) {
  const { 
    processingMode = 'label_only',
    printStyleCode = false,         
    brandingText = '',
    darkenThermal = false 
  } = options;

  const src = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await out.embedFont(StandardFonts.Helvetica);

  const manifestData = [{ sku: 'Meesho Batch Orders', qty: total }];
  const pdfjsDoc = printStyleCode ? await pdfjsLib.getDocument({ data: inputBytes.slice() }).promise : null;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);
    const sourcePage = src.getPage(i);

    let itemDetail = { styleCode: '', size: '' };
    if (printStyleCode && pdfjsDoc) {
      itemDetail = await extractMeeshoItemDetails(pdfjsDoc, i + 1);
    }

    if (processingMode === 'single_page') {
      const [copiedFullPage] = await out.copyPages(src, [i]);
      out.addPage(copiedFullPage);

    } else if (processingMode === 'keep_invoice') {
      const embedded = await out.embedPage(sourcePage, {
        left: INVOICE_TIGHT_CROP.x,
        bottom: A4.h - INVOICE_TIGHT_CROP.y - INVOICE_TIGHT_CROP.h,
        right: INVOICE_TIGHT_CROP.x + INVOICE_TIGHT_CROP.w,
        top: A4.h - INVOICE_TIGHT_CROP.y,
      });

      const page = out.addPage([INVOICE_TIGHT_CROP.w, INVOICE_TIGHT_CROP.h]);
      page.drawPage(embedded, { x: 0, y: 0, width: INVOICE_TIGHT_CROP.w, height: INVOICE_TIGHT_CROP.h });

      if (darkenThermal) {
        page.drawPage(embedded, { x: 0, y: 0, width: INVOICE_TIGHT_CROP.w, height: INVOICE_TIGHT_CROP.h, opacity: 0.25 });
      }

    } else {
      const embedded = await out.embedPage(sourcePage, {
        left: MEESHO_CROP.x,
        bottom: A4.h - MEESHO_CROP.y - MEESHO_CROP.h,
        right: MEESHO_CROP.x + MEESHO_CROP.w,
        top: A4.h - MEESHO_CROP.y,
      });

      const page = out.addPage([MEESHO_OUTPUT.w, MEESHO_OUTPUT.h]);
      page.drawPage(embedded, { x: 0, y: 0, width: MEESHO_OUTPUT.w, height: MEESHO_OUTPUT.h });

      if (darkenThermal) {
        page.drawPage(embedded, { x: 0, y: 0, width: MEESHO_OUTPUT.w, height: MEESHO_OUTPUT.h, opacity: 0.25 });
      }

      if (printStyleCode && itemDetail.styleCode !== 'N/A') {
        const detailText = `STYLE: ${itemDetail.styleCode} ${itemDetail.size ? `| SIZE: ${itemDetail.size}` : ''}`;
        page.drawText(detailText, {
          x: 10,
          y: 5,
          size: 8,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
      } else if (brandingText.trim()) {
        page.drawText(brandingText.trim(), {
          x: 10,
          y: 5,
          size: 7,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
    }
  }

  const pdfResultBytes = await out.save({ useObjectStreams: true, addDefaultPage: false });
  return { pdfResultBytes, manifestData };
}

// 4. Common Utils
export async function mergeMultiplePdfs(filesBytesArray) {
  const mergedPdf = await PDFDocument.create();
  for (const bytes of filesBytesArray) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

export function exportManifestToCSV(manifestData, platformName) {
  const header = ['Sr No', 'Platform', 'SKU / Item', 'Quantity'];
  const rows = manifestData.map((item, index) => [
    index + 1,
    platformName.toUpperCase(),
    `"${(item.sku || '').replace(/"/g, '""')}"`,
    item.qty || 1
  ]);
  const csvContent = [header.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${platformName}-manifest-summary.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export async function generatePickListPDF(manifestItems, platformName) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4.w, A4.h]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { width, height } = page.getSize();
  let y = height - 40;

  page.drawText(`${platformName.toUpperCase()} DISPATCH PICK-LIST SUMMARY`, { x: 40, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 18;
  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  page.drawText(`Generated on: ${dateStr} | Total Unique SKUs: ${manifestItems.length}`, { x: 40, y, size: 9, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
  y -= 25;
  page.drawRectangle({ x: 40, y: y - 5, width: width - 80, height: 22, color: rgb(0.92, 0.94, 0.96) });
  page.drawText('SR', { x: 48, y: y + 2, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('SKU CODE / ITEM DETAILS', { x: 80, y: y + 2, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  page.drawText('QUANTITY', { x: width - 120, y: y + 2, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
  y -= 24;

  let totalQtySum = 0;
  manifestItems.forEach((item, index) => {
    if (y < 45) return;
    const qtyNum = parseInt(item.qty, 10) || 1;
    totalQtySum += qtyNum;
    if (index % 2 === 1) {
      page.drawRectangle({ x: 40, y: y - 4, width: width - 80, height: 18, color: rgb(0.97, 0.98, 0.99) });
    }
    page.drawText(String(index + 1), { x: 48, y: y + 1, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    let labelText = item.sku;
    if (labelText.length > 60) labelText = labelText.slice(0, 57) + '...';
    page.drawText(labelText, { x: 80, y: y + 1, size: 8, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });
    page.drawText(String(item.qty), { x: width - 100, y: y + 1, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  });

  y -= 10;
  page.drawLine({ start: { x: 40, y: y + 10 }, end: { x: width - 40, y: y + 10 }, thickness: 1, color: rgb(0.8, 0.8, 0.8) });
  page.drawText(`TOTAL DISPATCH ITEMS: ${totalQtySum} Units`, { x: width - 210, y: y - 2, size: 10, font: fontBold, color: rgb(0.1, 0.4, 0.2) });

  return await doc.save();
}