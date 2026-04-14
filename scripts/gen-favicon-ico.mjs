/**
 * Gera public/favicon.ico (16×16, cor #38bdf8) sem dependências externas.
 * Executar: node scripts/gen-favicon-ico.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const out = path.join(root, "public", "favicon.ico");

const w = 16;
const h = 16;
const bmpHeaderSize = 40;
const pixelBytes = w * h * 4;
const andRowBytes = Math.ceil(w / 32) * 4;
const andMaskBytes = andRowBytes * h;
const imageBody = bmpHeaderSize + pixelBytes + andMaskBytes;

const hdr = Buffer.alloc(6);
hdr.writeUInt16LE(0, 0);
hdr.writeUInt16LE(1, 2);
hdr.writeUInt16LE(1, 4);

const entry = Buffer.alloc(16);
entry.writeUInt8(w, 0);
entry.writeUInt8(h, 1);
entry.writeUInt8(0, 2);
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4);
entry.writeUInt16LE(32, 6);
entry.writeUInt32LE(imageBody, 8);
entry.writeUInt32LE(22, 12);

const bmp = Buffer.alloc(imageBody);
bmp.writeUInt32LE(40, 0);
bmp.writeInt32LE(w, 4);
bmp.writeInt32LE(h * 2, 8);
bmp.writeUInt16LE(1, 12);
bmp.writeUInt16LE(32, 14);
bmp.writeUInt32LE(0, 16);
bmp.writeUInt32LE(pixelBytes, 20);

const B = 0xf8;
const G = 0xbd;
const R = 0x38;
const A = 0xff;
for (let y = 0; y < h; y++) {
  for (let x = 0; x < w; x++) {
    const dibY = h - 1 - y;
    const o = bmpHeaderSize + (dibY * w + x) * 4;
    bmp[o] = B;
    bmp[o + 1] = G;
    bmp[o + 2] = R;
    bmp[o + 3] = A;
  }
}
bmp.fill(0, bmpHeaderSize + pixelBytes);

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, Buffer.concat([hdr, entry, bmp]));
console.log("Wrote", out, Buffer.concat([hdr, entry, bmp]).length, "bytes");
