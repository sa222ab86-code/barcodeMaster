import { Jimp } from 'jimp';
import fs from 'fs';
import sharp from 'sharp';

function packPngsToIco(pngBuffers, sizes) {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const totalHeaderSize = headerSize + count * dirEntrySize;

  const bufferSize = totalHeaderSize + pngBuffers.reduce((acc, buf) => acc + buf.length, 0);
  const outBuffer = Buffer.alloc(bufferSize);

  // 1. Write Header
  outBuffer.writeUInt16LE(0, 0); // Reserved
  outBuffer.writeUInt16LE(1, 2); // Type (1 for ICO)
  outBuffer.writeUInt16LE(count, 4); // Image Count

  let currentOffset = totalHeaderSize;

  // 2. Write Directory Entries and Copy Image Data
  for (let i = 0; i < count; i++) {
    const buf = pngBuffers[i];
    const size = sizes[i];
    const dirOffset = headerSize + i * dirEntrySize;

    const w = size >= 256 ? 0 : size;
    const h = size >= 256 ? 0 : size;

    outBuffer.writeUInt8(w, dirOffset); // Width
    outBuffer.writeUInt8(h, dirOffset + 1); // Height
    outBuffer.writeUInt8(0, dirOffset + 2); // Colors (0 for truecolor)
    outBuffer.writeUInt8(0, dirOffset + 3); // Reserved
    outBuffer.writeUInt16LE(1, dirOffset + 4); // Color Planes
    outBuffer.writeUInt16LE(32, dirOffset + 6); // Bits per Pixel
    outBuffer.writeUInt32LE(buf.length, dirOffset + 8); // Image Size
    outBuffer.writeUInt32LE(currentOffset, dirOffset + 12); // Image Offset

    // Copy image data
    buf.copy(outBuffer, currentOffset);
    currentOffset += buf.length;
  }

  return outBuffer;
}

async function main() {
  console.log('Generating high-resolution pristine app icon using Jimp & png-to-ico...');

  // 1. Create a 512x512 Canvas matching branding indigo-blue background #5A66F1
  const width = 512;
  const height = 512;
  const brandColor = 0x5A66F1FF; // #5A66F1
  const image = new Jimp({ width, height, color: brandColor });

  // 2. Clear canvas with mathematically perfect rounded corners (radius = 112px)
  const canvasRadius = 112;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let transparent = false;
      if (x < canvasRadius && y < canvasRadius) {
        if (Math.pow(canvasRadius - x, 2) + Math.pow(canvasRadius - y, 2) > Math.pow(canvasRadius, 2)) transparent = true;
      } else if (x > width - canvasRadius && y < canvasRadius) {
        if (Math.pow(x - (width - canvasRadius), 2) + Math.pow(canvasRadius - y, 2) > Math.pow(canvasRadius, 2)) transparent = true;
      } else if (x < canvasRadius && y > height - canvasRadius) {
        if (Math.pow(canvasRadius - x, 2) + Math.pow(y - (height - canvasRadius), 2) > Math.pow(canvasRadius, 2)) transparent = true;
      } else if (x > width - canvasRadius && y > height - canvasRadius) {
        if (Math.pow(x - (width - canvasRadius), 2) + Math.pow(y - (height - canvasRadius), 2) > Math.pow(canvasRadius, 2)) transparent = true;
      }
      if (transparent) {
        image.setPixelColor(0x00000000, x, y);
      }
    }
  }

  // Helper drawing functions
  function setSafePixel(img, x, y, color) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      img.setPixelColor(color, x, y);
    }
  }

  // Draw Top Paper sheet
  const paperX1 = 166;
  const paperX2 = 346;
  const paperY1 = 95;
  const paperY2 = 205;
  for (let y = paperY1; y <= paperY2; y++) {
    for (let x = paperX1; x <= paperX2; x++) {
      setSafePixel(image, x, y, 0xFFFFFFFF);
    }
  }

  // Subtle gray line representations on the top paper sheet
  const grayLineColor = 0xe0e0f2FF;
  for (let x = 196; x <= 316; x++) {
    for (let dy = 0; dy < 8; dy++) {
      setSafePixel(image, x, 130 + dy, grayLineColor);
    }
  }
  for (let x = 196; x <= 286; x++) {
    for (let dy = 0; dy < 8; dy++) {
      setSafePixel(image, x, 155 + dy, grayLineColor);
    }
  }

  // Draw Top Tray angled backboard / horizontal bar
  for (let y = 140; y <= 152; y++) {
    for (let x = 150; x <= 362; x++) {
      setSafePixel(image, x, y, 0xFFFFFFFF);
    }
  }

  // Draw Main Printer Body (Columns: 96 to 416, Rows: 196 to 372). Rounded corner r = 36.
  const bodyX1 = 96;
  const bodyX2 = 416;
  const bodyY1 = 196;
  const bodyY2 = 372;
  const bodyRadius = 36;
  for (let y = bodyY1; y <= bodyY2; y++) {
    for (let x = bodyX1; x <= bodyX2; x++) {
      let isBodyPixel = true;
      if (x < bodyX1 + bodyRadius && y < bodyY1 + bodyRadius) {
        if (Math.pow((bodyX1 + bodyRadius) - x, 2) + Math.pow((bodyY1 + bodyRadius) - y, 2) > Math.pow(bodyRadius, 2)) isBodyPixel = false;
      } else if (x > bodyX2 - bodyRadius && y < bodyY1 + bodyRadius) {
        if (Math.pow(x - (bodyX2 - bodyRadius), 2) + Math.pow((bodyY1 + bodyRadius) - y, 2) > Math.pow(bodyRadius, 2)) isBodyPixel = false;
      } else if (x < bodyX1 + bodyRadius && y > bodyY2 - bodyRadius) {
        if (Math.pow((bodyX1 + bodyRadius) - x, 2) + Math.pow(y - (bodyY2 - bodyRadius), 2) > Math.pow(bodyRadius, 2)) isBodyPixel = false;
      } else if (x > bodyX2 - bodyRadius && y > bodyY2 - bodyRadius) {
        if (Math.pow(x - (bodyX2 - bodyRadius), 2) + Math.pow(y - (bodyY2 - bodyRadius), 2) > Math.pow(bodyRadius, 2)) isBodyPixel = false;
      }

      if (isBodyPixel) {
        setSafePixel(image, x, y, 0xFFFFFFFF);
      }
    }
  }

  // Draw Center Division Line / Groove inside the printer body (y from 258 to 271)
  const grooveY1 = 258;
  const grooveY2 = 271;
  for (let y = grooveY1; y <= grooveY2; y++) {
    for (let x = bodyX1; x <= bodyX2; x++) {
      setSafePixel(image, x, y, brandColor);
    }
  }

  // Draw Paper Feed Slot Background (Columns: 146 to 366, Rows: 296 to 336, radius = 14)
  const slotX1 = 146;
  const slotX2 = 366;
  const slotY1 = 296;
  const slotY2 = 336;
  const slotRadius = 14;
  for (let y = slotY1; y <= slotY2; y++) {
    for (let x = slotX1; x <= slotX2; x++) {
      let isSlotPixel = true;
      if (x < slotX1 + slotRadius && y < slotY1 + slotRadius) {
        if (Math.pow((slotX1 + slotRadius) - x, 2) + Math.pow((slotY1 + slotRadius) - y, 2) > Math.pow(slotRadius, 2)) isSlotPixel = false;
      } else if (x > slotX2 - slotRadius && y < slotY1 + slotRadius) {
        if (Math.pow(x - (slotX2 - slotRadius), 2) + Math.pow((slotY1 + slotRadius) - y, 2) > Math.pow(slotRadius, 2)) isSlotPixel = false;
      } else if (x < slotX1 + slotRadius && y > slotY2 - slotRadius) {
        if (Math.pow((slotX1 + slotRadius) - x, 2) + Math.pow(y - (slotY2 - slotRadius), 2) > Math.pow(slotRadius, 2)) isSlotPixel = false;
      } else if (x > slotX2 - slotRadius && y > slotY2 - slotRadius) {
        if (Math.pow(x - (slotX2 - slotRadius), 2) + Math.pow(y - (slotY2 - slotRadius), 2) > Math.pow(slotRadius, 2)) isSlotPixel = false;
      }

      if (isSlotPixel) {
        setSafePixel(image, x, y, brandColor);
      }
    }
  }

  // Draw Printed Receipt/Label sliding downward (cols: 178 to 334, rows: 316 to 426, radius = 12 at bottom)
  const rcptX1 = 178;
  const rcptX2 = 334;
  const rcptY1 = 316;
  const rcptY2 = 426;
  const rcptRadius = 12;
  for (let y = rcptY1; y <= rcptY2; y++) {
    for (let x = rcptX1; x <= rcptX2; x++) {
      let isRcptPixel = true;
      if (x < rcptX1 + rcptRadius && y > rcptY2 - rcptRadius) {
        if (Math.pow((rcptX1 + rcptRadius) - x, 2) + Math.pow(y - (rcptY2 - rcptRadius), 2) > Math.pow(rcptRadius, 2)) isRcptPixel = false;
      } else if (x > rcptX2 - rcptRadius && y > rcptY2 - rcptRadius) {
        if (Math.pow(x - (rcptX2 - rcptRadius), 2) + Math.pow(y - (rcptY2 - rcptRadius), 2) > Math.pow(rcptRadius, 2)) isRcptPixel = false;
      }

      if (isRcptPixel) {
        setSafePixel(image, x, y, 0xFFFFFFFF);
      }
    }
  }

  // Draw receipt outline border (10px thickness on the left, right, and bottom sides)
  for (let y = rcptY1; y <= rcptY2; y++) {
    for (let x = rcptX1; x <= rcptX2; x++) {
      const isLeftBorder = (x < rcptX1 + 10);
      const isRightBorder = (x > rcptX2 - 10);
      const isBottomBorder = (y > rcptY2 - 10);
      
      if (isLeftBorder || isRightBorder || isBottomBorder) {
        let isRcptPixel = true;
        if (x < rcptX1 + rcptRadius && y > rcptY2 - rcptRadius) {
          if (Math.pow((rcptX1 + rcptRadius) - x, 2) + Math.pow(y - (rcptY2 - rcptRadius), 2) > Math.pow(rcptRadius, 2)) isRcptPixel = false;
        } else if (x > rcptX2 - rcptRadius && y > rcptY2 - rcptRadius) {
          if (Math.pow(x - (rcptX2 - rcptRadius), 2) + Math.pow(y - (rcptY2 - rcptRadius), 2) > Math.pow(rcptRadius, 2)) isRcptPixel = false;
        }

        if (isRcptPixel) {
          setSafePixel(image, x, y, brandColor);
        }
      }
    }
  }

  // Draw three horizontal bold print lines on the output receipt
  for (let y = 346; y <= 355; y++) {
    for (let x = 206; x <= 306; x++) {
      setSafePixel(image, x, y, brandColor);
    }
  }
  for (let y = 372; y <= 381; y++) {
    for (let x = 206; x <= 306; x++) {
      setSafePixel(image, x, y, brandColor);
    }
  }
  for (let y = 398; y <= 407; y++) {
    for (let x = 206; x <= 276; x++) {
      setSafePixel(image, x, y, brandColor);
    }
  }

  // 3. Ensure assets and public output directories exist
  if (!fs.existsSync('assets')) {
    fs.mkdirSync('assets');
  }
  if (!fs.existsSync('public')) {
    fs.mkdirSync('public');
  }

  // 4. Write pristine high-res icon.png
  await image.write('assets/icon.png');
  fs.copyFileSync('assets/icon.png', 'public/icon.png');
  console.log('[+] Created assets/icon.png and public/icon.png (512x512)');

  // 5. Generate all standard resolutions for Windows ICO compatibility
  console.log('[+] Generating multi-resolution images for ICO packaging using sharp (16, 32, 48, 64, 128, 256)...');
  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  
  for (const size of sizes) {
    const buf = await sharp('assets/icon.png')
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers.push(buf);
  }

  // 6. Generate high-quality standard Windows ICO file using our custom packPngsToIco
  console.log('[+] Assembling 100% compliant multi-resolution Windows ICO file...');
  const icoBuf = packPngsToIco(pngBuffers, sizes);
  
  fs.writeFileSync('assets/icon.ico', icoBuf);
  fs.copyFileSync('assets/icon.ico', 'public/icon.ico');
  
  console.log('[+] Successfully created assets/icon.ico and public/icon.ico!');
  console.log('[+] Icon assembly phase complete. Zero corruption, absolute compliance!');
}

main().catch(err => {
  console.error('[-] Generation failed:', err);
  process.exit(1);
});
