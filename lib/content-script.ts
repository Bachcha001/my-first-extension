import { MOOD_COLORS, type GiraffeMood } from './giraffe'

let readingStyleEl: HTMLStyleElement | null = null

export function mainTextStyle(
  mood: GiraffeMood,
  preset: 'soft' | 'plain' | 'highcontrast',
): string {
  const colors = MOOD_COLORS[mood]
  const lines: string[] = []

  lines.push('/* giraffe reading help */')

  if (preset === 'soft') {
    lines.push(`
      html.giraffe-reading {
        filter: contrast(1.02) saturate(0.96) brightness(1.03) !important;
      }
      html.giraffe-reading body {
        color: ${colors.text} !important;
        background: transparent !important;
      }
      html.giraffe-reading :not(script):not(style):not(noscript):not(link):not(template):not(path):not(svg) {
        max-width: 70ch !important;
        margin-left: auto !important;
        margin-right: auto !important;
      }
      html.giraffe-reading img,
      html.giraffe-reading video,
      html.giraffe-reading iframe,
      html.giraffe-reading canvas {
        max-width: 100% !important;
        height: auto !important;
      }
    `)
  } else if (preset === 'plain') {
    lines.push(`
      html.giraffe-reading body,
      html.giraffe-reading p,
      html.giraffe-reading li,
      html.giraffe-reading td,
      html.giraffe-reading th,
      html.giraffe-reading h1,
      html.giraffe-reading h2,
      html.giraffe-reading h3,
      html.giraffe-reading h4,
      html.giraffe-reading span,
      html.giraffe-reading div,
      html.giraffe-reading a {
        color: ${colors.text} !important;
        background: transparent !important;
      }
      html.giraffe-reading :not(script):not(style):not(noscript):not(link):not(template):not(path):not(svg) {
        max-width: 78ch !important;
        margin-left: auto !important;
        margin-right: auto !important;
        line-height: 1.6 !important;
      }
    `)
  } else {
    lines.push(`
      html.giraffe-reading body {
        color: #111 !important;
        background: #fff !important;
      }
      html.giraffe-reading :not(script):not(style):not(noscript):not(link):not(template):not(path):not(svg) {
        color: #111 !important;
        background: #fff !important;
      }
      html.giraffe-reading a {
        color: #0b5cab !important;
      }
      html.giraffe-reading :not(script):not(style):not(noscript):not(link):not(template):not(path):not(svg) {
        max-width: 80ch !important;
        margin-left: auto !important;
        margin-right: auto !important;
        line-height: 1.55 !important;
      }
    `)
  }

  return lines.join('\n')
}

export function applyReadingHelp(
  mood: GiraffeMood,
  preset: 'soft' | 'plain' | 'highcontrast',
) {
  if (readingStyleEl) {
    readingStyleEl.textContent = mainTextStyle(mood, preset)
    document.documentElement.classList.add('giraffe-reading')
    return
  }
  readingStyleEl = document.createElement('style')
  readingStyleEl.setAttribute('data-giraffe', 'reading')
  readingStyleEl.textContent = mainTextStyle(mood, preset)
  document.head.appendChild(readingStyleEl)
  document.documentElement.classList.add('giraffe-reading')
}

export function removeReadingHelp() {
  document.documentElement.classList.remove('giraffe-reading')
  if (readingStyleEl) {
    readingStyleEl.remove()
    readingStyleEl = null
  }
}

export function mainTextExcerpt(): string {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>(
      'article, main, [role="main"], .content, .post-content, .entry-content, .story-body, .prose, p, li',
    ),
  )

  let best = ''
  let bestScore = 0

  for (const el of candidates) {
    const text = (el.innerText || '').trim()
    if (text.length < 200) continue
    const noise = el.querySelectorAll(
      'a, nav, header, footer, aside, .menu, .nav, .sidebar',
    ).length
    const score = text.length - noise * 50
    if (score > bestScore) {
      bestScore = score
      best = text
    }
  }

  if (!best) {
    best = document.body ? document.body.innerText || '' : ''
  }

  return best.replace(/\s+/g, ' ').trim().slice(0, 1400)
}

export async function capturePageFrame(): Promise<{
  blob: Blob
  width: number
  height: number
} | null> {
  const target =
    document.querySelector<HTMLElement>('article, main, [role="main"], body') ||
    document.body
  if (!target) return null

  const box = target.getBoundingClientRect()
  const width = Math.max(320, Math.round(box.width))
  const height = Math.max(240, Math.round(box.height))
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  const ctx = canvas.getContext('2d', { willReadFrequently: false })
  if (!ctx) return null

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  try {
    ctx.drawImage(target as unknown as HTMLCanvasElement, 0, 0, width, height)
  } catch {
    // Some sites block canvas reads; degrade gracefully.
  }

  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob: Blob | null) =>
          resolve(blob ? { blob, width, height } : null),
        'image/png',
        0.9,
      )
    } catch {
      resolve(null)
    }
  })
}
