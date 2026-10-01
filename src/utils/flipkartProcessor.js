import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const A4 = { w: 595.28, h: 841.89 };

// Output page size: 4×6 inch thermal
const THERMAL_PAGE = { w: 288, h: 432 };

// ─────────────────────────────────────────────────────────────
// FLIPKART FINAL LOCKED COORDINATES (V13)
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

// 🎯 WHITE MARGIN AROUND LABEL (in PDF points)
// 3 pt ≈ 1 mm,  6 pt ≈ 2 mm,  8 pt ≈ 3 mm,  12 pt ≈ 4 mm
const EXPAND_MARGIN = 1;

// Helper — expand a crop region by a margin on all 4 sides
function expandCrop(crop, margin) {
  return {
    x: crop.x - margin,
    bottom: crop.bottom - margin,
    w: crop.w + margin * 2,
    h: crop.h + margin * 2,
  };
}

const LABEL_EXPANDED = expandCrop(LABEL, EXPAND_MARGIN);
const INVOICE_EXPANDED = expandCrop(INVOICE, EXPAND_MARGIN);

// ─────────────────────────────────────────────────────────────
// 1. Flipkart Live Preview
// ─────────────────────────────────────────────────────────────
export async function renderFlipkartPreview(inputBytes, canvas, options = {}) {
  const { darkenThermal = false, processingMode = 'label_only' } = options;
  const loading = pdfjsLib.getDocument({ data: inputBytes.slice() });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const scale = 1.6;
  const vp = page.getViewport({ scale });

  const actualW = vp.width / scale;
  const actualH = vp.height / scale;
  const isA4Page = Math.abs(actualW - A4.w) < 20 && Math.abs(actualH - A4.h) < 20;

  let srcCrop;

  if (processingMode === 'single_page' || !isA4Page) {
    srcCrop = { x: 0, y: 0, w: actualW, h: actualH };
  } else if (processingMode === 'keep_invoice') {
    const labelTop = A4.h - (LABEL_EXPANDED.bottom + LABEL_EXPANDED.h);
    const invBottom = INVOICE_EXPANDED.bottom;
    const leftX = Math.min(LABEL_EXPANDED.x, INVOICE_EXPANDED.x);
    const rightX = Math.max(
      LABEL_EXPANDED.x + LABEL_EXPANDED.w,
      INVOICE_EXPANDED.x + INVOICE_EXPANDED.w
    );
    srcCrop = {
      x: leftX,
      y: labelTop,
      w: rightX - leftX,
      h: A4.h - labelTop - invBottom,
    };
  } else {
    srcCrop = {
      x: LABEL_EXPANDED.x,
      y: A4.h - (LABEL_EXPANDED.bottom + LABEL_EXPANDED.h),
      w: LABEL_EXPANDED.w,
      h: LABEL_EXPANDED.h,
    };
  }

  const sx = srcCrop.x * scale;
  const sy = srcCrop.y * scale;
  const sw = srcCrop.w * scale;
  const sh = srcCrop.h * scale;

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

  const LABEL_TOLERANCE = 30 + EXPAND_MARGIN * 2;
  const OUTPUT_PADDING = 4;

  const availW = THERMAL_PAGE.w - OUTPUT_PADDING * 2;
  const availH = THERMAL_PAGE.h - OUTPUT_PADDING * 2;

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total);

    const sourcePage = src.getPage(i);
    const { width: pw, height: ph } = sourcePage.getSize();

    const isA4Page =
      Math.abs(pw - A4.w) < 20 && Math.abs(ph - A4.h) < 20;

    const isAlreadyLabel =
      Math.abs(pw - LABEL_EXPANDED.w) < LABEL_TOLERANCE &&
      Math.abs(ph - LABEL_EXPANDED.h) < LABEL_TOLERANCE;

    // Single Page — full copy
    if (processingMode === 'single_page') {
      const [copiedFull] = await out.copyPages(src, [i]);
      out.addPage(copiedFull);
      continue;
    }

    // Already label-sized → scale to thermal
    if (isAlreadyLabel) {
      const [copied] = await out.copyPages(src, [i]);
      const thermPage = out.addPage([THERMAL_PAGE.w, THERMAL_PAGE.h]);

      const scale = Math.min(availW / pw, availH / ph);
      const w = pw * scale;
      const h = ph * scale;
      const embedded = await out.embedPage(copied);

      thermPage.drawPage(embedded, {
        x: (THERMAL_PAGE.w - w) / 2,
        y: (THERMAL_PAGE.h - h) / 2,
        width: w,
        height: h,
      });

      if (brandingText.trim()) {
        thermPage.drawText(brandingText.trim(), {
          x: (THERMAL_PAGE.w - w) / 2,
          y: 6,
          size: 8,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }
      continue;
    }

    // A4 page → crop + scale to thermal
    if (isA4Page) {
      // Label Only
      if (processingMode === 'label_only') {
        const embedded = await out.embedPage(sourcePage, {
          left: LABEL_EXPANDED.x,
          bottom: LABEL_EXPANDED.bottom,
          right: LABEL_EXPANDED.x + LABEL_EXPANDED.w,
          top: LABEL_EXPANDED.bottom + LABEL_EXPANDED.h,
        });

        const page = out.addPage([THERMAL_PAGE.w, THERMAL_PAGE.h]);

        const scale = Math.min(availW / LABEL_EXPANDED.w, availH / LABEL_EXPANDED.h);
        const w = LABEL_EXPANDED.w * scale;
        const h = LABEL_EXPANDED.h * scale;

        page.drawPage(embedded, {
          x: (THERMAL_PAGE.w - w) / 2,
          y: (THERMAL_PAGE.h - h) / 2,
          width: w,
          height: h,
        });

        if (darkenThermal) {
          page.drawPage(embedded, {
            x: (THERMAL_PAGE.w - w) / 2,
            y: (THERMAL_PAGE.h - h) / 2,
            width: w,
            height: h,
            opacity: 0.25,
          });
        }

        if (brandingText.trim()) {
          page.drawText(brandingText.trim(), {
            x: (THERMAL_PAGE.w - w) / 2,
            y: 6,
            size: 8,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
        }
        continue;
      }

      // Keep Invoice
      if (processingMode === 'keep_invoice') {
        const labelEmbedded = await out.embedPage(sourcePage, {
          left: LABEL_EXPANDED.x,
          bottom: LABEL_EXPANDED.bottom,
          right: LABEL_EXPANDED.x + LABEL_EXPANDED.w,
          top: LABEL_EXPANDED.bottom + LABEL_EXPANDED.h,
        });

        const labelPage = out.addPage([THERMAL_PAGE.w, THERMAL_PAGE.h]);

        const labelScale = Math.min(availW / LABEL_EXPANDED.w, availH / LABEL_EXPANDED.h);
        const labelW = LABEL_EXPANDED.w * labelScale;
        const labelH = LABEL_EXPANDED.h * labelScale;

        labelPage.drawPage(labelEmbedded, {
          x: (THERMAL_PAGE.w - labelW) / 2,
          y: (THERMAL_PAGE.h - labelH) / 2,
          width: labelW,
          height: labelH,
        });

        if (darkenThermal) {
          labelPage.drawPage(labelEmbedded, {
            x: (THERMAL_PAGE.w - labelW) / 2,
            y: (THERMAL_PAGE.h - labelH) / 2,
            width: labelW,
            height: labelH,
            opacity: 0.25,
          });
        }

        const invoiceEmbedded = await out.embedPage(sourcePage, {
          left: INVOICE_EXPANDED.x,
          bottom: INVOICE_EXPANDED.bottom,
          right: INVOICE_EXPANDED.x + INVOICE_EXPANDED.w,
          top: INVOICE_EXPANDED.bottom + INVOICE_EXPANDED.h,
        });

        const invoicePage = out.addPage([THERMAL_PAGE.w, THERMAL_PAGE.h]);

        const rotatedW = INVOICE_EXPANDED.h;
        const rotatedH = INVOICE_EXPANDED.w;

        const invScale = Math.min(availW / rotatedW, availH / rotatedH);
        const invDrawW = rotatedW * invScale;
        const invDrawH = rotatedH * invScale;

        const invMarginX = (THERMAL_PAGE.w - invDrawW) / 2;
        const invMarginY = (THERMAL_PAGE.h - invDrawH) / 2;

        invoicePage.drawPage(invoiceEmbedded, {
          x: invMarginX,
          y: THERMAL_PAGE.h - invMarginY,
          width: invDrawH,
          height: invDrawW,
          rotate: degrees(-90),
        });

        if (darkenThermal) {
          invoicePage.drawPage(invoiceEmbedded, {
            x: invMarginX,
            y: THERMAL_PAGE.h - invMarginY,
            width: invDrawH,
            height: invDrawW,
            rotate: degrees(-90),
            opacity: 0.25,
          });
        }
        continue;
      }
    }

    // Fallback
    const embedded = await out.embedPage(sourcePage, {
      left: 0, bottom: 0, right: pw, top: ph,
    });

    const page = out.addPage([THERMAL_PAGE.w, THERMAL_PAGE.h]);

    const scale = Math.min(availW / pw, availH / ph);
    const w = pw * scale;
    const h = ph * scale;

    page.drawPage(embedded, {
      x: (THERMAL_PAGE.w - w) / 2,
      y: (THERMAL_PAGE.h - h) / 2,
      width: w,
      height: h,
    });
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