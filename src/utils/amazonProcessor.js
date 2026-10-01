import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const A4 = { w: 595.28, h: 841.89 };
const AMAZON_CROP = { x: 17, y: 12, w: 561, h: 830 };

// ─────────────────────────────────────────────────────────────
// SKU / QTY HEADER STYLING (tune these to change size)
// ─────────────────────────────────────────────────────────────
const HEADER_FONT_SIZE = 7;       // ← SKU + QTY text size (was 9)
const HEADER_Y_OFFSET = 12;       // ← distance from top (was 16)
const HEADER_TRUNCATE_GAP = 120;  // ← less gap = more room for SKU text (was 145)

// 1. Amazon Invoice & Item Details Extraction
async function extractAmazonInvoiceInfo(pdfjsDoc, invoicePageNum) {
  try {
    const page = await pdfjsDoc.getPage(invoicePageNum);
    const tc = await page.getTextContent();
    const items = tc.items.map((x) => (x.str || '').trim()).filter(Boolean);
    const text = items.join(' ');

    let sku = '';
    let description = '';

    const match1 = text.match(/\bB0[A-Z0-9]{8}\b[^(]*\(([^)]+)\)/i);
    if (match1 && match1[1]) sku = match1[1].trim();

    const match2 = text.match(/Description[\s\S]*?:\s*([^\n\r(]+)/i);
    if (match2 && match2[1]) description = match2[1].trim();

    if (!sku) {
      const matchFallback = text.match(/Description[\s\S]*?\(([^)]+)\)[\s\S]*?HSN/i);
      if (matchFallback && matchFallback[1]) sku = matchFallback[1].trim();
    }

    if (!sku) {
      const match3 = text.match(/\(([^)]+)\)\s*HSN/i);
      if (match3 && match3[1]) sku = match3[1].trim();
    }

    let qty = '1';
    const qtyMatch = text.match(/HSN\s*:\s*\d+\s+₹?[\d,.]+\s+(\d+)\s+₹?[\d,.]+/i);
    if (qtyMatch && qtyMatch[1]) {
      qty = qtyMatch[1].trim();
    } else {
      const fallbackQty = text.match(/(\b\d+\b)\s+[\d,.]+\s+(?:18%|9%|5%|12%|IGST|CGST|SGST)/i);
      if (fallbackQty && fallbackQty[1]) qty = fallbackQty[1].trim();
    }

    return {
      sku: sku || 'Standard Item',
      description: description || sku || 'Item Details',
      qty: qty || '1'
    };
  } catch (e) {
    return { sku: 'Standard Item', description: 'Item Details', qty: '1' };
  }
}

// 2. Amazon Live Preview
export async function renderAmazonPreview(inputBytes, canvas, options = {}) {
  const { darkenThermal = false } = options;
  const loading = pdfjsLib.getDocument({ data: inputBytes.slice() });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const scale = 1.6;
  const vp = page.getViewport({ scale });

  const sx = AMAZON_CROP.x * scale, sy = AMAZON_CROP.y * scale;
  const sw = AMAZON_CROP.w * scale, sh = AMAZON_CROP.h * scale;

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
  
  let firstSku = 'Loading SKU...';
  let firstQty = '1';
  try {
    if (doc.numPages >= 2) {
      const info = await extractAmazonInvoiceInfo(doc, 2);
      firstSku = info.sku;
      firstQty = info.qty;
    }
  } catch (_) {}

  ctx.filter = 'none';
  ctx.fillStyle = '#000000';
  // ✅ Smaller preview text (matches output PDF)
  ctx.font = `700 ${9 * scale}px Arial`;
  ctx.fillText(`SKU: ${firstSku}`, 10 * scale, HEADER_Y_OFFSET * scale);
  ctx.fillText(`QTY: ${firstQty}`, (sw / scale - 55) * scale, HEADER_Y_OFFSET * scale);
}

// 3. Amazon Label Processing Engine
export async function processAmazonLabels(inputBytes, onProgress, options = {}) {
  const { 
    amazonInvoiceMode = 'remove',  
    amazonSkuMode = 'id_only',      
    sortBySku = false, 
    brandingText = '',
    darkenThermal = false 
  } = options;

  const src = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await out.embedFont(StandardFonts.Helvetica);

  if (total < 2 || total % 2 !== 0) {
    throw new Error('Amazon PDF requires 2 pages per order (Page 1: Label, Page 2: Invoice).');
  }

  const pdfjsDoc = await pdfjsLib.getDocument({ data: inputBytes.slice() }).promise;
  const ordersCount = total / 2;
  const ordersData = [];

  for (let order = 0; order < ordersCount; order++) {
    if (onProgress) onProgress(order + 1, ordersCount);
    const labelPageIndex = order * 2;
    const invoicePageNumber = order * 2 + 2;
    const info = await extractAmazonInvoiceInfo(pdfjsDoc, invoicePageNumber);
    ordersData.push({
      labelPageIndex,
      invoicePageIndex: order * 2 + 1,
      sku: info.sku,
      description: info.description,
      qty: info.qty,
    });
  }

  if (sortBySku) {
    ordersData.sort((a, b) => a.sku.localeCompare(b.sku));
  }

  const grouped = {};
  ordersData.forEach((item) => {
    const q = parseInt(item.qty, 10) || 1;
    grouped[item.sku] = (grouped[item.sku] || 0) + q;
  });
  const manifestData = Object.entries(grouped).map(([sku, qty]) => ({ sku, qty }));

  const outputW = AMAZON_CROP.w;
  const outputH = AMAZON_CROP.h;

  // ✅ Header Y position (smaller = closer to top edge)
  const headerY = outputH - HEADER_Y_OFFSET;

  for (const item of ordersData) {
    const sourcePage = src.getPage(item.labelPageIndex);
    const embedded = await out.embedPage(sourcePage, {
      left: AMAZON_CROP.x,
      bottom: A4.h - AMAZON_CROP.y - AMAZON_CROP.h,
      right: AMAZON_CROP.x + AMAZON_CROP.w,
      top: A4.h - AMAZON_CROP.y,
    });

    const page = out.addPage([outputW, outputH]);
    page.drawPage(embedded, { x: 0, y: 0, width: outputW, height: outputH });

    if (darkenThermal) {
      page.drawPage(embedded, { x: 0, y: 0, width: outputW, height: outputH, opacity: 0.25 });
    }

    // ✅ Smaller SKU label
    page.drawText('SKU:', {
      x: 8,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    let skuDisplay = item.sku;
    if (amazonSkuMode === 'with_desc' && item.description && item.description !== item.sku) {
      skuDisplay = `${item.sku} - ${item.description}`;
    }

    // ✅ Use HEADER_FONT_SIZE for truncation calc (not hardcoded 9)
    const maxSkuWidth = outputW - HEADER_TRUNCATE_GAP;
    while (
      skuDisplay.length > 5 &&
      fontBold.widthOfTextAtSize(skuDisplay, HEADER_FONT_SIZE) > maxSkuWidth
    ) {
      skuDisplay = skuDisplay.slice(0, -1);
    }
    if (skuDisplay !== item.sku && !skuDisplay.endsWith('...')) skuDisplay += '...';

    // ✅ Smaller SKU text
    page.drawText(skuDisplay, {
      x: 28,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // ✅ Smaller QTY text
    page.drawText(`QTY: ${item.qty}`, {
      x: outputW - 48,
      y: headerY,
      size: HEADER_FONT_SIZE,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    if (brandingText.trim()) {
      page.drawText(brandingText.trim(), {
        x: 12,
        y: 6,
        size: 6,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    if (amazonInvoiceMode === 'keep') {
      const [copiedInv] = await out.copyPages(src, [item.invoicePageIndex]);
      out.addPage(copiedInv);
    }
  }

  const pdfResultBytes = await out.save({ useObjectStreams: true, addDefaultPage: false });
  return { pdfResultBytes, manifestData };
}

// 4. Common Utils (Shared)
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