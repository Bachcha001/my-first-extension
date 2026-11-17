import { createCanvas } from 'canvas'
import { writeFileSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const out = join(__dirname, '../entrypoints/icons')
mkdirSync(out, { recursive: true })

const giraffePath = (size: number, tint: string, bg: string) => {
  const c = createCanvas(size, size)
  const ctx = c.getContext('2d')

  ctx.fillStyle = bg
  ctx.fillRect(0, 0, size, size)

  const pad = size * 0.08
  const s = size - pad * 2
  const cx = size / 2
  const bodyY = size * 0.58

  const body = (x: number, y: number, rx: number, ry: number) => {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = tint
  body(cx, bodyY, s * 0.2, s * 0.13)

  // spots
  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  const spots: Array<[number, number]> = [
    [-0.14, -0.09],
    [-0.05, -0.13],
    [0.1, -0.12],
    [0.19, -0.04],
    [-0.21, 0.02],
    [0.05, 0.06],
    [-0.07, 0.1],
  ]
  for (const [sx, sy] of spots) {
    ctx.beginPath()
    ctx.ellipse(cx + sx * s, bodyY + sy * s, s * 0.022, s * 0.016, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  // neck
  ctx.fillStyle = tint
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.09, bodyY - s * 0.12)
  ctx.lineTo(cx - s * 0.12, bodyY - s * 0.42)
  ctx.lineTo(cx + s * 0.12, bodyY - s * 0.42)
  ctx.lineTo(cx + s * 0.09, bodyY - s * 0.12)
  ctx.closePath()
  ctx.fill()

  // head
  ctx.fillStyle = tint
  ctx.beginPath()
  ctx.ellipse(cx, bodyY - s * 0.46, s * 0.11, s * 0.085, 0, 0, Math.PI * 2)
  ctx.fill()

  // ossicones
  ctx.strokeStyle = tint
  ctx.lineWidth = s * 0.022
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.055, bodyY - s * 0.54)
  ctx.lineTo(cx - s * 0.075, bodyY - s * 0.63)
  ctx.moveTo(cx + s * 0.055, bodyY - s * 0.54)
  ctx.lineTo(cx + s * 0.075, bodyY - s * 0.63)
  ctx.stroke()
  ctx.fillStyle = tint
  ctx.beginPath()
  ctx.arc(cx - s * 0.075, bodyY - s * 0.63, s * 0.022, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + s * 0.075, bodyY - s * 0.63, s * 0.022, 0, Math.PI * 2)
  ctx.fill()

  // ears
  ctx.fillStyle = tint
  ctx.beginPath()
  ctx.ellipse(cx - s * 0.14, bodyY - s * 0.44, s * 0.045, s * 0.025, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + s * 0.14, bodyY - s * 0.44, s * 0.045, s * 0.025, 0.4, 0, Math.PI * 2)
  ctx.fill()

  // face
  ctx.fillStyle = '#fff6e9'
  ctx.beginPath()
  ctx.ellipse(cx - s * 0.045, bodyY - s * 0.47, s * 0.022, s * 0.032, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + s * 0.045, bodyY - s * 0.47, s * 0.022, s * 0.032, 0, 0, Math.PI * 2)
  ctx.fill()

  // snout
  ctx.fillStyle = '#f4e6d3'
  ctx.beginPath()
  ctx.ellipse(cx, bodyY - s * 0.38, s * 0.055, s * 0.036, 0, 0, Math.PI * 2)
  ctx.fill()

  // smile
  ctx.strokeStyle = '#7a4a2c'
  ctx.lineWidth = s * 0.012
  ctx.beginPath()
  ctx.moveTo(cx - s * 0.025, bodyY - s * 0.365)
  ctx.quadraticCurveTo(cx, bodyY - s * 0.34, cx + s * 0.025, bodyY - s * 0.365)
  ctx.stroke()

  // eyes
  ctx.fillStyle = '#2a2a2a'
  ctx.beginPath()
  ctx.arc(cx - s * 0.025, bodyY - s * 0.485, s * 0.012, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + s * 0.025, bodyY - s * 0.485, s * 0.012, 0, Math.PI * 2)
  ctx.fill()

  // legs
  ctx.strokeStyle = tint
  ctx.lineWidth = s * 0.045
  ctx.lineCap = 'round'
  for (const i of [-1, 1]) {
    const lx = cx + i * s * 0.095
    ctx.beginPath()
    ctx.moveTo(lx - s * 0.012, bodyY + s * 0.1)
    ctx.lineTo(lx - s * 0.012 + i * s * 0.012, bodyY + s * 0.1 + s * 0.16)
    ctx.stroke()
  }

  // tail
  ctx.strokeStyle = tint
  ctx.lineWidth = s * 0.03
  ctx.beginPath()
  ctx.moveTo(cx + s * 0.19, bodyY - s * 0.04)
  ctx.quadraticCurveTo(cx + s * 0.25, bodyY - s * 0.11, cx + s * 0.27, bodyY - s * 0.03)
  ctx.stroke()
  ctx.fillStyle = '#f4e6d3'
  ctx.beginPath()
  ctx.arc(cx + s * 0.27, bodyY - s * 0.03, s * 0.02, 0, Math.PI * 2)
  ctx.fill()

  return c
}

const palettes = [
  { bg: '#fbf6ef', tint: '#e8c49a', file: 'icon-16.png' },
  { bg: '#fbf6ef', tint: '#f4a26b', file: 'icon-32.png' },
  { bg: '#fbf6ef', tint: '#d48c5e', file: 'icon-48.png' },
  { bg: '#fbf6ef', tint: '#7fa69a', file: 'icon-128.png' },
]

for (const { bg, tint, file } of palettes) {
  const c = giraffePath(128, tint, bg)
  const outPath = join(out, file)
  writeFileSync(outPath, c.toBuffer('image/png'))
  console.log('wrote', outPath)
}
