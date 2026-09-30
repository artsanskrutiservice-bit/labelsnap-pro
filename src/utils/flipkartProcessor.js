import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MM = 72 / 25.4;
const A4 = { w: 595.28, h: 841.89 };

// ─────────────────────────────────────────────────────────────
// FLIPKART FINAL LOCKED COORDINATES (V13)
// Coordinate system: bottom-left origin (pdf-lib native)
// ─────────────────────────────────────────────────────────────
const LABEL = {
  x: 189.50,
  bottom: 459.52,
  w: 216.35,
  h: 354.74,
};

const INVOICE = {
  x: 49.49,
  bottom: 230.47,
  w: 502.07,
  h: 223.82,
};

// Legacy top-based crop (kept for backward compatibility with old preview)
const FLIPKART_LABEL = { x: 191, y: 28.5, w: 212.5, h: 352.5 };
const FLIPKART_MARGIN = 0.5 * MM;
const FLIPKART_CROP = {
  x: FLIPKART_LABEL.x - FLIPKART_MARGIN,
  y: FLIPKART_LABEL.y - FLIPKART_MARGIN,
  w: FLIPKART_LABEL.w + 2 * FLIPKART_MARGIN,
  h: FLIPKART_LABEL.h + 2 * FLIPKART_MARGIN,
};

// ─────────────────────────────────────────────────────────────
// 1. Flipkart Live Preview
//    modes: 'label_only' | 'single_page' | 'keep_invoice'
// ─────────────────────────────────────────────────────────────
export async function renderFlipkartPreview(inputBytes, canvas, options = {}) {
  const { darkenThermal = false, processingMode = 'label_only' } = options;

  const loading = pdfjsLib.getDocument({ data: inputBytes.slice() });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const scale = 1.6;
  const vp = page.getViewport({ scale });

  // Pick crop region (top-based y for canvas rendering)
  let activeCrop;

  if (processingMode === 'single_page') {
    activeCrop = { x: 0, y: 0, w: A4.w, h: A4.h };
  } else if (processingMode === 'keep_invoice') {
    // Combine LABEL + INVOICE into one preview box
    // LABEL: bottom=459.52, h=354.74  → top = A4.h - (459.52+354.74) = 27.63
    // INVOICE: bottom=230.47, h=223.82 → top = A4.h - (230.47+223.82) = 387.60
    // Combined top = 27.63, combined bottom = 230.47
    const topY = A4.h - (LABEL.bottom + LABEL.h);  // 27.63
    const bottomY = INVOICE.bottom;                 // 230.47
    activeCrop = {
      x: INVOICE.x,
      y: topY,
      w: Math.max(LABEL.w, INVOICE.w),
      h: A4.h - topY - bottomY,
    };
  } else {
    // label_only — use V13 LABEL coordinates (converted to top-based)
    activeCrop = {
      x: LABEL.x,
      y: A4.h - (LABEL.bottom + LABEL.h),
      w: LABEL.w,
      h: LABEL.h,
    };
  }

  const sx = activeCrop.x * scale;
  const sy = activeCrop.y * scale;
  const sw = activeCrop.w * scale;
  const sh = activeCrop.h * scale;

  const full = document.createElement('canvas');
  full.width = Math.ceil(vp.width);
  full.height = Math.ceil(vp.height);
  await page.render({ canvasContext: full.getContext('2d'), viewport: vp }).promise;

  canvas.width = Math.ceil(sw);
  canvas.height = Math.ceil(sh);
  const ctx = canvas.getContext('2d');

  ctx.filter = darkenThermal ? 'contrast(140%) brightness(95%)' : 'none';
  ctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
}

// ─────────────────────────────────────────────────────────────
// 2. Flipkart Label Processing Engine
//    modes: 'label_only' | 'single_page' | 'keep_invoice'
// ─────────────────────────────────────────────────────────────
export async function processFlipkartLabels(inputBytes, onProgress, options = {}) {
  const {
    processingMode = 'label_only',
    brandingText = '',
    darkenThermal = false,
  } = options;

  const src = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  const fontRegular = await out.embedFont(StandardFonts.Helvetica);
  const manifestData = [{ sku: 'Flipkart Batch Orders', qty: total }];

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    // ─── Mode: Single Page (full A4 copy) ───────────────────
    if (processingMode === 'single_page') {
      const [copiedFull] = await out.copyPages(src, [i]);
      out.addPage(copiedFull);
      continue;
    }

    // ─── Mode: Label Only (V13 LOCKED method) ───────────────
    if (processingMode === 'label_only') {
      const embedded = await out.embedPage(src.getPage(i), {
        left: LABEL.x,
        bottom: LABEL.bottom,
        right: LABEL.x + LABEL.w,
        top: LABEL.bottom + LABEL.h,
      });

      const page = out.addPage([LABEL.w, LABEL.h]);

      // Draw the embedded region 1:1 onto the output page
      page.drawPage(embedded, {
        x: 0,
        y: 0,
        width: LABEL.w,
        height: LABEL.h,
      });

      if (darkenThermal) {
        page.drawPage(embedded, {
          x: 0,
          y: 0,
          width: LABEL.w,
          height: LABEL.h,
          opacity: 0.25,
        });
      }

      if (brandingText.trim()) {
        page.drawText(brandingText.trim(), {
          x: 6,
          y: 5,
          size: 7,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      continue;
    }

    // ─── Mode: Keep Invoice (Label + Tax Invoice, V13 method) ─
    if (processingMode === 'keep_invoice') {
      // -------- PAGE 1: Label --------
      const labelEmbedded = await out.embedPage(src.getPage(i), {
        left: LABEL.x,
        bottom: LABEL.bottom,
        right: LABEL.x + LABEL.w,
        top: LABEL.bottom + LABEL.h,
      });

      const labelPage = out.addPage([LABEL.w, LABEL.h]);
      labelPage.drawPage(labelEmbedded, {
        x: 0,
        y: 0,
        width: LABEL.w,
        height: LABEL.h,
      });

      if (darkenThermal) {
        labelPage.drawPage(labelEmbedded, {
          x: 0,
          y: 0,
          width: LABEL.w,
          height: LABEL.h,
          opacity: 0.25,
        });
      }

      // -------- PAGE 2: Tax Invoice (rotated -90°) --------
      const invoiceEmbedded = await out.embedPage(src.getPage(i), {
        left: INVOICE.x,
        bottom: INVOICE.bottom,
        right: INVOICE.x + INVOICE.w,
        top: INVOICE.bottom + INVOICE.h,
      });

      const invoicePage = out.addPage([LABEL.w, LABEL.h]);

      // Rotate invoice 90° counter-clockwise and fit into LABEL box
      const rotatedW = INVOICE.h; // width after rotation
      const rotatedH = INVOICE.w; // height after rotation

      const scale = Math.min(
        LABEL.w / rotatedW,
        LABEL.h / rotatedH
      );

      const drawW = rotatedW * scale;
      const drawH = rotatedH * scale;

      const marginX = (LABEL.w - drawW) / 2;
      const marginY = (LABEL.h - drawH) / 2;

      invoicePage.drawPage(invoiceEmbedded, {
        x: marginX,
        y: LABEL.h - marginY,
        width: drawH,
        height: drawW,
        rotate: degrees(-90),
      });

      if (darkenThermal) {
        invoicePage.drawPage(invoiceEmbedded, {
          x: marginX,
          y: LABEL.h - marginY,
          width: drawH,
          height: drawW,
          rotate: degrees(-90),
          opacity: 0.25,
        });
      }

      continue;
    }
  }

  const pdfResultBytes = await out.save({
    useObjectStreams: true,
    addDefaultPage: false,
  });

  return { pdfResultBytes, manifestData };
}

// ─────────────────────────────────────────────────────────────
// 3. Common Utils
// ─────────────────────────────────────────────────────────────
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
    item.qty || 1,
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