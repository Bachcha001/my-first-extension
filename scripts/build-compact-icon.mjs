// Build a compact palette PNG icon (128x128) with very few colours so the
// committed file stays tiny and byte-stable. Run: node scripts/build-compact-icon.mjs
import { deflateSync } from 'node:zlib'
import { writeFileSync } from 'node:fs'

const W = 128
const H = 128

const palette = [
  [0xfb, 0xf6, 0xef],
  [0xe0, 0xa9, 0x74],
  [0xb0, 0x76, 0x45],
  [0x2a, 0x2a, 0x2a],
]

const px = new Uint8Array(W * H)

const set = (x, y, c) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return
  px[y * W + x] = c
}

const ellipse = (cx, cy, rx, ry, c) => {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / rx
      const dy = (y - cy) / ry
      if (dx * dx + dy * dy <= 1) set(x, y, c)
    }
  }
}

const rect = (x0, y0, x1, y1, c) => {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c)
}

rect(56, 34, 72, 78, 1)
ellipse(64, 88, 34, 24, 1)
ellipse(64, 30, 17, 13, 1)
rect(44, 100, 50, 122, 1)
rect(78, 100, 84, 122, 1)
rect(54, 12, 57, 20, 1)
rect(71, 12, 74, 20, 1)
ellipse(44, 26, 7, 4, 1)
ellipse(84, 26, 7, 4, 1)
ellipse(50, 84, 5, 4, 2)
ellipse(64, 92, 6, 4, 2)
ellipse(78, 84, 5, 4, 2)
ellipse(60, 76, 4, 3, 2)
ellipse(72, 70, 4, 3, 2)
ellipse(64, 44, 4, 3, 2)
set(57, 28, 3)
set(58, 28, 3)
set(69, 28, 3)
set(70, 28, 3)
ellipse(64, 36, 7, 4, 2)

const raw = Buffer.alloc(H * (1 + W))
for (let y = 0; y < H; y++) {
  raw[y * (1 + W)] = 0
  for (let x = 0; x < W; x++) raw[y * (1 + W) + 1 + x] = px[y * W + x]
}

const table = new Int32Array(256)
for (let n = 0; n < 256; n++) {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  table[n] = c
}
const crc32 = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = table[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

const chunk = (type, data) => {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length, 0)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)
  return Buffer.concat([len, body, crc])
}

const ihdr = Buffer.alloc(13)
ihdr.writeUInt32BE(W, 0)
ihdr.writeUInt32BE(H, 4)
ihdr[8] = 8
ihdr[9] = 3
ihdr[10] = 0
ihdr[11] = 0
ihdr[12] = 0

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('PLTE', Buffer.from(palette.flat())),
  chunk('IDAT', deflateSync(raw, { level: 9 })),
  chunk('IEND', Buffer.alloc(0)),
])

for (const name of ['icon-16.png', 'icon-32.png', 'icon-48.png', 'icon-128.png']) {
  writeFileSync(`entrypoints/icons/${name}`, png)
}
console.log('wrote', png.length, 'bytes to each icon')
console.log(png.toString('base64'))
