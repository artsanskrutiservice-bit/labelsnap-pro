import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Local Vite worker import (CDN ni jarur nahi pade ane version mismatch nahi thay)
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const MM = 72 / 25.4;
const A4 = { w: 595.28, h: 841.89 };

// Flipkart Formulas[cite: 1]
const FLIPKART_LABEL = { x: 191, y: 28.5, w: 212.5, h: 352.5 };
const FLIPKART_MARGIN = 0.5 * MM;
const FLIPKART_CROP = {
  x: FLIPKART_LABEL.x - FLIPKART_MARGIN,
  y: FLIPKART_LABEL.y - FLIPKART_MARGIN,
  w: FLIPKART_LABEL.w + 2 * FLIPKART_MARGIN,
  h: FLIPKART_LABEL.h + 2 * FLIPKART_MARGIN,
};

// Meesho Formulas[cite: 1]
const MEESHO_BOTTOM_EXTRA = 2 * MM;
const MEESHO_OUTPUT = { w: 595, h: 348.2 + MEESHO_BOTTOM_EXTRA };
const MEESHO_CROP = {
  x: 0,
  y: 0,
  w: 595,
  h: 348.2 + MEESHO_BOTTOM_EXTRA,
};

// Amazon Formulas[cite: 1]
const AMAZON_CROP = { x: 17, y: 12, w: 561, h: 830 };

// Dynamic Invoice SKU & QTY Extraction Function[cite: 1, 5]
async function extractAmazonInvoiceInfo(pdfjsDoc, invoicePageNum) {
  try {
    const page = await pdfjsDoc.getPage(invoicePageNum);
    const tc = await page.getTextContent();
    const items = tc.items.map((x) => (x.str || '').trim()).filter(Boolean);
    const text = items.join(' ');

    let sku = '';

    // 1. ASIN pachhi aavti brackets: e.g. "B0HF8FTFHB (Man Massage oil 4S5AF)"[cite: 5]
    const match1 = text.match(/\bB0[A-Z0-9]{8}\b[^(]*\(([^)]+)\)/i);
    if (match1 && match1[1]) {
      sku = match1[1].trim();
    }

    // 2. Fallback: Description block ma aavti brackets[cite: 5]
    if (!sku) {
      const match2 = text.match(/Description[\s\S]*?\(([^)]+)\)[\s\S]*?HSN/i);
      if (match2 && match2[1]) {
        sku = match2[1].trim();
      }
    }

    // 3. Fallback: HSN code pahela aavti koi pan brackets[cite: 5]
    if (!sku) {
      const match3 = text.match(/\(([^)]+)\)\s*HSN/i);
      if (match3 && match3[1]) {
        sku = match3[1].trim();
      }
    }

    // Quantity (QTY) Extraction[cite: 1, 5]
    let qty = '1';
    const qtyMatch = text.match(/HSN\s*:\s*\d+\s+₹?[\d,.]+\s+(\d+)\s+₹?[\d,.]+/i);
    if (qtyMatch && qtyMatch[1]) {
      qty = qtyMatch[1].trim();
    } else {
      const fallbackQty = text.match(/(\b\d+\b)\s+[\d,.]+\s+(?:18%|9%|5%|12%|IGST|CGST|SGST)/i);
      if (fallbackQty && fallbackQty[1]) {
        qty = fallbackQty[1].trim();
      }
    }

    return {
      sku: sku || 'SKU Not Found',
      qty: qty || '1'
    };
  } catch (e) {
    console.error(`Error on Page ${invoicePageNum}:`, e);
    return { sku: 'SKU Not Found', qty: '1' };
  }
}

// Live Canvas Preview Function[cite: 1]
export async function renderPreviewCanvas(inputBytes, platform, canvas) {
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

  if (platform === 'amazon') {
    ctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);

    // First label live preview fetching from page 2 (Invoice)[cite: 1, 5]
    let firstSku = 'Loading SKU...';
    let firstQty = '1';
    try {
      if (doc.numPages >= 2) {
        const info = await extractAmazonInvoiceInfo(doc, 2);
        firstSku = info.sku;
        firstQty = info.qty;
      }
    } catch (_) {}

    ctx.fillStyle = '#000000';
    ctx.font = `700 ${11 * scale}px Arial`;
    ctx.fillText(`SKU ID: ${firstSku}`, 10 * scale, 15 * scale);
    ctx.fillText(`QTY: ${firstQty}`, (sw / scale - 65) * scale, 15 * scale);
  } else {
    ctx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
  }
}

// Main PDF Processing Function[cite: 1]
export async function processLabels(inputBytes, platform, onProgress) {
  const src = await PDFDocument.load(inputBytes, { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const total = src.getPageCount();

  const fontBold = await out.embedFont(StandardFonts.HelveticaBold);

  if (platform === 'amazon') {
    if (total < 2 || total % 2 !== 0) {
      throw new Error('Amazon PDF ma 2 pages per order hova joie (Page 1: Label, Page 2: Invoice).');
    }

    const pdfjsDoc = await pdfjsLib.getDocument({ data: inputBytes.slice() }).promise;
    const orders = total / 2;
    const outputW = AMAZON_CROP.w;
    const outputH = AMAZON_CROP.h;

    for (let order = 0; order < orders; order++) {
      if (onProgress) onProgress(order + 1, orders);

      const labelPageIndex = order * 2;         // Page 1, 3, 5... (Shipping Labels)[cite: 5]
      const invoicePageNumber = order * 2 + 2;   // Page 2, 4, 6... (Invoices)[cite: 5]

      // Nichena page mathi dynamic data extract thase[cite: 5]
      const invoiceInfo = await extractAmazonInvoiceInfo(pdfjsDoc, invoicePageNumber);

      const sourcePage = src.getPage(labelPageIndex);
      const embedded = await out.embedPage(sourcePage, {
        left: AMAZON_CROP.x,
        bottom: A4.h - AMAZON_CROP.y - AMAZON_CROP.h,
        right: AMAZON_CROP.x + AMAZON_CROP.w,
        top: A4.h - AMAZON_CROP.y,
      });

      const page = out.addPage([outputW, outputH]);

      // 1. Cropped Shipping Label draw karo
      page.drawPage(embedded, { x: 0, y: 0, width: outputW, height: outputH });

      // 2. Top-Left: SKU ID print karo[cite: 6]
      page.drawText('SKU ID:', {
        x: 10,
        y: outputH - 16,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      let skuText = invoiceInfo.sku;
      const maxSkuWidth = outputW - 145;
      while (skuText.length > 5 && fontBold.widthOfTextAtSize(skuText, 9) > maxSkuWidth) {
        skuText = skuText.slice(0, -1);
      }
      if (skuText !== invoiceInfo.sku) skuText += '...';

      page.drawText(skuText, {
        x: 55,
        y: outputH - 16,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      // 3. Top-Right: QTY print karo[cite: 6]
      page.drawText(`QTY: ${invoiceInfo.qty}`, {
        x: outputW - 65,
        y: outputH - 16,
        size: 9,
        font: fontBold,
        color: rgb(0, 0, 0),
      });
    }
  } else {
    // Flipkart ane Meesho processing[cite: 1]
    const isMeesho = platform === 'meesho';
    const activeCrop = isMeesho ? MEESHO_CROP : FLIPKART_CROP;

    for (let i = 0; i < total; i++) {
      if (onProgress) onProgress(i + 1, total);
      const sourcePage = src.getPage(i);

      const embedded = await out.embedPage(sourcePage, {
        left: activeCrop.x,
        bottom: A4.h - activeCrop.y - activeCrop.h,
        right: activeCrop.x + activeCrop.w,
        top: A4.h - activeCrop.y,
      });

      if (isMeesho) {
        const page = out.addPage([MEESHO_OUTPUT.w, MEESHO_OUTPUT.h]);
        page.drawPage(embedded, { x: 0, y: 0, width: MEESHO_OUTPUT.w, height: MEESHO_OUTPUT.h });
      } else {
        const page = out.addPage([A4.w, A4.h]);
        const scale = Math.min((A4.w - 36) / activeCrop.w, (A4.h - 36) / activeCrop.h);
        const w = activeCrop.w * scale;
        const h = activeCrop.h * scale;
        page.drawPage(embedded, { x: (A4.w - w) / 2, y: (A4.h - h) / 2, width: w, height: h });
      }
    }
  }

  return await out.save({ useObjectStreams: true, addDefaultPage: false });
}