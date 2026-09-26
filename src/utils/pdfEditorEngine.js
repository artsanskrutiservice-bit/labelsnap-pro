import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Helper to convert HEX color string to pdf-lib rgb object
 * @param {string} hex - e.g. "#ff0000" or "#10b981"
 * @returns {Object} pdf-lib rgb
 */
export function hexToRgbColor(hex) {
  if (!hex) return rgb(0, 0, 0);
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex.length === 3 
    ? cleanHex.split('').map(c => c + c).join('') 
    : cleanHex, 16);
  return rgb(
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255
  );
}

/**
 * 1. Batch Apply All Editor Operations (Text, Signatures, Whiteouts, Stamps)
 * Processes all modifications in a single pass for maximum browser speed.
 * 
 * @param {Uint8Array|ArrayBuffer} pdfBytes - Source PDF
 * @param {Array<Object>} operations - List of edit objects
 * @returns {Promise<Uint8Array>} - Modified PDF bytes
 */
export async function applyEditorOperations(pdfBytes, operations = []) {
  if (!pdfBytes) throw new Error('No PDF provided to edit.');
  if (operations.length === 0) return pdfBytes;

  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pages = pdfDoc.getPages();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  for (const op of operations) {
    const pageIndex = op.pageIndex || 0;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;

    const page = pages[pageIndex];
    const { width: pageWidth, height: pageHeight } = page.getSize();

    // Coordinate conversion: If normalized ratio [0..1] is provided, convert to PDF points
    const toPdfX = (x) => (x <= 1 && x >= 0 ? x * pageWidth : x);
    const toPdfY = (y) => (y <= 1 && y >= 0 ? y * pageHeight : y);

    switch (op.type) {
      // ----------------------------------------------------
      // A. WHITEOUT / REDACT / ERASE BOX
      // ----------------------------------------------------
      case 'whiteout': {
        const x = toPdfX(op.x);
        const y = toPdfY(op.y);
        const w = toPdfX(op.width);
        const h = toPdfY(op.height);
        const color = op.fillColor ? hexToRgbColor(op.fillColor) : rgb(1, 1, 1);

        page.drawRectangle({
          x,
          y,
          width: w,
          height: h,
          color,
          borderColor: op.borderColor ? hexToRgbColor(op.borderColor) : undefined,
          borderWidth: op.borderWidth || 0,
        });
        break;
      }

      // ----------------------------------------------------
      // B. ADD TEXT OVERLAY
      // ----------------------------------------------------
      case 'text': {
        if (!op.text || !op.text.trim()) break;
        const x = toPdfX(op.x);
        const y = toPdfY(op.y);
        const fontSize = Number(op.fontSize) || 12;
        const font = op.isBold ? fontBold : fontRegular;
        const color = op.color ? hexToRgbColor(op.color) : rgb(0, 0, 0);

        page.drawText(op.text, {
          x,
          y,
          size: fontSize,
          font,
          color,
        });
        break;
      }

      // ----------------------------------------------------
      // C. DIGITAL SIGNATURE / STAMP IMAGE (PNG/JPG)
      // ----------------------------------------------------
      case 'signature':
      case 'image': {
        if (!op.imageDataUrl) break;
        
        let embeddedImage;
        if (op.imageDataUrl.startsWith('data:image/jpeg') || op.imageDataUrl.startsWith('data:image/jpg')) {
          embeddedImage = await pdfDoc.embedJpg(op.imageDataUrl);
        } else {
          embeddedImage = await pdfDoc.embedPng(op.imageDataUrl);
        }

        const x = toPdfX(op.x);
        const y = toPdfY(op.y);
        const width = Number(op.width) || 120;
        const height = Number(op.height) || (width / embeddedImage.width) * embeddedImage.height;

        page.drawImage(embeddedImage, {
          x,
          y,
          width,
          height,
        });
        break;
      }

      // ----------------------------------------------------
      // D. VECTOR STAMPS (PAID, CANCELLED, VERIFIED, URGENT)
      // ----------------------------------------------------
      case 'stamp': {
        const stampText = (op.stampText || 'PAID').toUpperCase();
        const x = toPdfX(op.x);
        const y = toPdfY(op.y);
        const fontSize = 18;
        const textWidth = fontBold.widthOfTextAtSize(stampText, fontSize);
        const boxPadding = 10;
        const boxWidth = textWidth + boxPadding * 2;
        const boxHeight = fontSize + boxPadding * 1.5;

        // Stamp theme color configuration
        let stampColor = rgb(0.1, 0.6, 0.2); // Green for PAID/VERIFIED
        if (stampText === 'CANCELLED' || stampText === 'REJECTED') {
          stampColor = rgb(0.85, 0.15, 0.15); // Red
        } else if (stampText === 'URGENT') {
          stampColor = rgb(0.9, 0.45, 0.05); // Amber
        }

        // Draw Stamp Outer Border Box
        page.drawRectangle({
          x,
          y,
          width: boxWidth,
          height: boxHeight,
          borderWidth: 2,
          borderColor: stampColor,
          color: rgb(1, 1, 1),
          opacity: 0.9,
        });

        // Draw Centered Stamp Text
        page.drawText(stampText, {
          x: x + boxPadding,
          y: y + boxPadding * 0.7,
          size: fontSize,
          font: fontBold,
          color: stampColor,
        });
        break;
      }

      default:
        break;
    }
  }

  return await pdfDoc.save();
}

/**
 * 2. Convert DataURL to Raw Bytes
 */
export function dataUrlToUint8Array(dataUrl) {
  const base64 = dataUrl.split(',')[1];
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}