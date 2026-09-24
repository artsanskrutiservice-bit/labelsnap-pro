import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MM = 72 / 25.4;
const A4 = { w: 595.28, h: 841.89 };

// Flipkart Label Coordinates
const FLIPKART_LABEL = { x: 191, y: 28.5, w: 212.5, h: 352.5 };
const FLIPKART_MARGIN = 0.5 * MM;
const FLIPKART_CROP = {
  x: FLIPKART_LABEL.x - FLIPKART_MARGIN,
  y: FLIPKART_LABEL.y - FLIPKART_MARGIN,
  w: FLIPKART_LABEL.w + 2 * FLIPKART_MARGIN,
  h: FLIPKART_LABEL.h + 2 * FLIPKART_MARGIN,
};

// Meesho Thermal Format Coordinates
const MEESHO_BOTTOM_EXTRA = 2 * MM;
const MEESHO_OUTPUT = { w: 595, h: 348.2 + MEESHO_BOTTOM_EXTRA };
const MEESHO_CROP = {
  x: 0,
  y: 0,
  w: 595,
  h: 348.2 + MEESHO_BOTTOM_EXTRA,
};

// Amazon Crop Coordinates
const AMAZON_CROP = { x: 17, y: 12, w: 561, h: 830 };

// Amazon Invoice & Item Details Extraction
async function extractAmazonInvoiceInfo(pdfjsDoc, invoicePageNum) {
  try {
    const page = await pdfjsDoc.getPage(invoicePageNum);
    const tc = await page.getTextContent();
    const items = tc.items.map((x) => (x.str || '').trim()).filter(Boolean);
    const text = items.join(' ');

    let sku = '';
    let description = '';

    // 1. ASIN bracket check
    const match1 = text.match(/\bB0[A-Z0-9]{8}\b[^(]*\(([^)]+)\)/i);
    if (match1 && match1[1]) sku = match1[1].trim();

    // 2. Fallback description block
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

    // Quantity Extraction
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

// Meesho Style Code and Size Extractor
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

// Live Preview Canvas Generator
export async function renderPreviewCanvas(inputBytes, platform, canvas, options = {}) {
  const { darkenThermal = false } = options;
  const loading = pdfjsLib.getDocument({ data: inputBytes.slice() });
  const doc = await loading.promise;
  const page = await doc.getPage(1);
  const scale = 1.6;
  const vp = page.getViewport({ scale });

  let activeCrop = FLIPKART_CROP;
  if (platform === 'meesho') activeCrop = MEESHO_CROP;
  if (platform === 'amazon') activeCrop = AMAZON_CROP;

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

  if (platform === 'amazon') {
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
    ctx.font = `700 ${11 * scale}px Arial`;
    ctx.fillText(`SKU: ${firstSku}`, 10 * scale, 15 * scale);
    ctx.fillText(`QTY: ${firstQty}`, (sw / scale - 65) * scale, 15 * scale);
  } else {
    ctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
  }
}

// Multi-PDF Merge
export async function mergeMultiplePdfs(filesBytesArray) {
  const mergedPdf = await PDFDocument.create();
  for (const bytes of filesBytesArray) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save();
}

// CSV Manifest Exporter
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

// Pick-List PDF Generator
export async function generatePickListPDF(manifestItems, platformName) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([A4.w, A4.h]);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let y = height - 40;

  page.drawText(`${platformName.toUpperCase()} DISPATCH PICK-LIST SUMMARY`, {
    x: 40,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 18;

  const dateStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  page.drawText(`Generated on: ${dateStr} | Total Unique SKUs: ${manifestItems.length}`, {
    x: 40,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 25;

  page.drawRectangle({
    x: 40,
    y: y - 5,
    width: width - 80,
    height: 22,
    color: rgb(0.92, 0.94, 0.96),
  });

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
      page.drawRectangle({
        x: 40,
        y: y - 4,
        width: width - 80,
        height: 18,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    page.drawText(String(index + 1), { x: 48, y: y + 1, size: 8, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });

    let labelText = item.sku;
    if (labelText.length > 60) labelText = labelText.slice(0, 57) + '...';
    page.drawText(labelText, { x: 80, y: y + 1, size: 8, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    page.drawText(String(item.qty), { x: width - 100, y: y + 1, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 18;
  });

  y -= 10;
  page.drawLine({
    start: { x: 40, y: y + 10 },
    end: { x: width - 40, y: y + 10 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  page.drawText(`TOTAL DISPATCH ITEMS: ${totalQtySum} Units`, {
    x: width - 210,
    y: y - 2,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.4, 0.2),
  });

  return await doc.save();
}

// Master Process Labels Engine
export async function processLabels(inputBytes, platform, onProgress, options = {}) {
  const { 
    processingMode = 'label_only', // 'label_only' | 'single_page' | 'split_pages'[cite: 2, 4]
    amazonInvoiceMode = 'remove',   // 'remove' | 'keep'[cite: 3]
    amazonSkuMode = 'id_only',     // 'id_only' | 'with_desc'[cite: 3]
    printStyleCode = false,         // Meesho SKU & Size print[cite: 4]
    sortBySku = false, 
    brandingText = '',
    darkenThermal = false 
  } = options;

  const src = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await out.embedFont(StandardFonts.Helvetica);

  let manifestData = [];

  if (platform === 'amazon') {
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
    manifestData = Object.entries(grouped).map(([sku, qty]) => ({ sku, qty }));

    const outputW = AMAZON_CROP.w;
    const outputH = AMAZON_CROP.h;

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

      // Print SKU Title
      page.drawText('SKU:', { x: 10, y: outputH - 16, size: 9, font: fontBold, color: rgb(0, 0, 0) });

      let skuDisplay = item.sku;
      if (amazonSkuMode === 'with_desc' && item.description && item.description !== item.sku) {
        skuDisplay = `${item.sku} - ${item.description}`;
      }

      const maxSkuWidth = outputW - 145;
      while (skuDisplay.length > 5 && fontBold.widthOfTextAtSize(skuDisplay, 9) > maxSkuWidth) {
        skuDisplay = skuDisplay.slice(0, -1);
      }
      if (skuDisplay !== item.sku && !skuDisplay.endsWith('...')) skuDisplay += '...';

      page.drawText(skuDisplay, { x: 42, y: outputH - 16, size: 8.5, font: fontBold, color: rgb(0, 0, 0) });
      page.drawText(`QTY: ${item.qty}`, { x: outputW - 65, y: outputH - 16, size: 9, font: fontBold, color: rgb(0, 0, 0) });

      if (brandingText.trim()) {
        page.drawText(brandingText.trim(), {
          x: 15,
          y: 8,
          size: 7.5,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      // If user chose "Keep Invoice"[cite: 3]
      if (amazonInvoiceMode === 'keep') {
        const invPage = src.getPage(item.invoicePageIndex);
        const [copiedInv] = await out.copyPages(src, [item.invoicePageIndex]);
        out.addPage(copiedInv);
      }
    }
  } else if (platform === 'meesho') {
    manifestData = [{ sku: 'Meesho Batch Orders', qty: total }];
    const pdfjsDoc = printStyleCode ? await pdfjsLib.getDocument({ data: inputBytes.slice() }).promise : null;

    for (let i = 0; i < total; i++) {
      if (onProgress) onProgress(i + 1, total);
      const sourcePage = src.getPage(i);

      let itemDetail = { styleCode: '', size: '' };
      if (printStyleCode && pdfjsDoc) {
        itemDetail = await extractMeeshoItemDetails(pdfjsDoc, i + 1);
      }

      if (processingMode === 'single_page') {
        // Single Page: Label + Invoice together on A4 to avoid penalties[cite: 4]
        const page = out.addPage([A4.w, A4.h]);
        const [copiedFullPage] = await out.copyPages(src, [i]);
        page.drawPage(copiedFullPage, { x: 0, y: 0, width: A4.w, height: A4.h });
      } else {
        // Label Only (Thermal 4x6 default)[cite: 4]
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

        // Print Style Code & Size[cite: 4]
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
  } else {
    // Flipkart Modes[cite: 2]
    manifestData = [{ sku: 'Flipkart Batch Orders', qty: total }];

    for (let i = 0; i < total; i++) {
      if (onProgress) onProgress(i + 1, total);
      const sourcePage = src.getPage(i);

      if (processingMode === 'single_page') {
        // Full Single Page mode[cite: 2]
        const [copiedFull] = await out.copyPages(src, [i]);
        out.addPage(copiedFull);
      } else {
        // Label Only Cropped[cite: 2]
        const embedded = await out.embedPage(sourcePage, {
          left: FLIPKART_CROP.x,
          bottom: A4.h - FLIPKART_CROP.y - FLIPKART_CROP.h,
          right: FLIPKART_CROP.x + FLIPKART_CROP.w,
          top: A4.h - FLIPKART_CROP.y,
        });

        const page = out.addPage([A4.w, A4.h]);
        const scale = Math.min((A4.w - 36) / FLIPKART_CROP.w, (A4.h - 36) / FLIPKART_CROP.h);
        const w = FLIPKART_CROP.w * scale;
        const h = FLIPKART_CROP.h * scale;
        page.drawPage(embedded, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });

        if (darkenThermal) {
          page.drawPage(embedded, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h, opacity: 0.25 });
        }

        if (brandingText.trim()) {
          page.drawText(brandingText.trim(), {
            x: (A4.w - w) / 2,
            y: (A4.h - h) / 2 - 14,
            size: 8,
            font: fontRegular,
            color: rgb(0.2, 0.2, 0.2),
          });
        }
      }
    }
  }

  const pdfResultBytes = await out.save({ useObjectStreams: true, addDefaultPage: false });
  return { pdfResultBytes, manifestData };
}