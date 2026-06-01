const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const size = 1024;
const pixels = Buffer.alloc(size * size * 4);

function clamp(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function setPixel(x, y, color) {
  if (x < 0 || y < 0 || x >= size || y >= size) return;
  const i = (y * size + x) * 4;
  const a = (color[3] == null ? 255 : color[3]) / 255;
  const ia = 1 - a;
  pixels[i] = clamp(color[0] * a + pixels[i] * ia);
  pixels[i + 1] = clamp(color[1] * a + pixels[i + 1] * ia);
  pixels[i + 2] = clamp(color[2] * a + pixels[i + 2] * ia);
  pixels[i + 3] = 255;
}

function fillBackground() {
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = (x - size * 0.5) / size;
      const ny = (y - size * 0.44) / size;
      const d = Math.sqrt(nx * nx + ny * ny);
      const glow = Math.max(0, 1 - d * 2.2);
      const side = Math.max(0, 1 - Math.hypot((x - size * 0.78) / size, (y - size * 0.22) / size) * 3);
      const i = (y * size + x) * 4;
      pixels[i] = clamp(7 + glow * 18 + side * 24);
      pixels[i + 1] = clamp(12 + glow * 34 + side * 8);
      pixels[i + 2] = clamp(24 + glow * 58 + side * 52);
      pixels[i + 3] = 255;
    }
  }
}

function drawLine(x1, y1, x2, y2, width, color) {
  const minX = Math.floor(Math.min(x1, x2) - width);
  const maxX = Math.ceil(Math.max(x1, x2) + width);
  const minY = Math.floor(Math.min(y1, y2) - width);
  const maxY = Math.ceil(Math.max(y1, y2) + width);
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len2 = vx * vx + vy * vy;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const t = Math.max(0, Math.min(1, ((x - x1) * vx + (y - y1) * vy) / len2));
      const px = x1 + vx * t;
      const py = y1 + vy * t;
      const dist = Math.hypot(x - px, y - py);
      if (dist <= width) {
        const fade = Math.max(0, 1 - dist / width);
        setPixel(x, y, [color[0], color[1], color[2], (color[3] || 255) * fade]);
      }
    }
  }
}

function drawCircle(cx, cy, r, color) {
  const minX = Math.floor(cx - r), maxX = Math.ceil(cx + r);
  const minY = Math.floor(cy - r), maxY = Math.ceil(cy + r);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= r) {
        const edge = Math.min(1, r - d);
        setPixel(x, y, [color[0], color[1], color[2], (color[3] || 255) * edge]);
      }
    }
  }
}

function drawRing(cx, cy, r, width, color) {
  const minX = Math.floor(cx - r - width), maxX = Math.ceil(cx + r + width);
  const minY = Math.floor(cy - r - width), maxY = Math.ceil(cy + r + width);
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const d = Math.hypot(x - cx, y - cy);
      const edge = Math.abs(d - r);
      if (edge <= width) {
        const fade = Math.max(0, 1 - edge / width);
        setPixel(x, y, [color[0], color[1], color[2], (color[3] || 255) * fade]);
      }
    }
  }
}

function poly(cx, cy, r, sides, rot) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const a = rot + (i / sides) * Math.PI * 2;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return pts;
}

function insidePoly(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i][0], yi = pts[i][1];
    const xj = pts[j][0], yj = pts[j][1];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function drawPoly(pts, color) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const minX = Math.floor(Math.min(...xs)), maxX = Math.ceil(Math.max(...xs));
  const minY = Math.floor(Math.min(...ys)), maxY = Math.ceil(Math.max(...ys));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (insidePoly(x + 0.5, y + 0.5, pts)) setPixel(x, y, color);
    }
  }
}

function drawScene() {
  fillBackground();

  for (let x = -size; x < size * 2; x += 76) {
    drawLine(x, 0, x - 230, size, 1.3, [88, 221, 255, 18]);
  }

  drawRing(512, 512, 258, 8, [88, 221, 255, 95]);
  drawRing(512, 512, 178, 4, [183, 124, 255, 82]);
  drawCircle(512, 512, 168, [88, 221, 255, 25]);

  drawCircle(512, 512, 132, [88, 221, 255, 130]);
  drawPoly(poly(512, 512, 108, 6, Math.PI / 6), [96, 223, 255, 255]);
  drawPoly(poly(512, 512, 56, 6, Math.PI / 6), [4, 16, 31, 255]);
  drawPoly(poly(512, 512, 24, 6, Math.PI / 6), [88, 221, 255, 255]);

  drawPoly(poly(512, 210, 46, 5, -Math.PI / 2), [255, 207, 90, 255]);
  drawCircle(790, 324, 50, [255, 95, 145, 255]);
  drawPoly(poly(770, 724, 67, 4, 0), [255, 207, 90, 255]);
  drawPoly(poly(245, 710, 64, 3, -Math.PI / 2), [97, 240, 168, 255]);
  drawCircle(322, 806, 34, [183, 124, 255, 255]);

  drawLine(512, 512, 790, 324, 9, [88, 221, 255, 130]);
  drawLine(512, 512, 245, 710, 7, [97, 240, 168, 105]);
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])), 0);
  return Buffer.concat([len, name, data, crc]);
}

function pngBuffer() {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = row + 1 + x * 3;
      raw[dst] = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

function writeIcon(file) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, pngBuffer());
  console.log(`Wrote ${file}`);
}

drawScene();
writeIcon('assets/app-icon-1024.png');
writeIcon('www/app-icon.png');

const appIconDir = 'ios/App/App/Assets.xcassets/AppIcon.appiconset';
if (fs.existsSync('ios/App/App/Assets.xcassets')) {
  writeIcon(path.join(appIconDir, 'AppIcon-512@2x.png'));
  fs.writeFileSync(path.join(appIconDir, 'Contents.json'), JSON.stringify({
    images: [
      { filename: 'AppIcon-512@2x.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }
    ],
    info: { author: 'xcode', version: 1 }
  }, null, 2) + '\n');
}
