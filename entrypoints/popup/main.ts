import {
  MOODS,
  MOOD_COLORS,
  type GiraffeMood,
  currentGiraffe,
} from '../../lib/giraffe'
import {
  giraffeSetMood,
  giraffeSaveSnapshot,
  giraffeGetSnapshots,
} from '../../lib/giraffe-api'
import {
  applyReadingHelp as csApplyReadingHelp,
  removeReadingHelp as csRemoveReadingHelp,
  mainTextExcerpt as csMainTextExcerpt,
  capturePageFrame as csCapturePageFrame,
} from '../../lib/content-script'
import './style.css'

type Snapshot = {
  id: string
  url: string
  title: string
  takenAt: number
  note: string
}

function moodChip(
  mood: GiraffeMood,
  active: boolean,
  onClick: () => void,
) {
  const el = document.createElement('button')
  el.type = 'button'
  el.className = `mood-chip${active ? ' active' : ''}`
  el.title = mood
  el.style.setProperty('--chip-color', MOOD_COLORS[mood].body)
  el.innerHTML = `
    <span class="mood-dot" aria-hidden="true"></span>
    <span class="mood-label">${mood}</span>
  `
  el.addEventListener('click', onClick)
  return el
}

function render(root: HTMLElement, state: {
  mood: GiraffeMood
  playful: boolean
  preset: 'soft' | 'plain' | 'highcontrast'
  snapshots: Snapshot[]
  saving: boolean
  saved: boolean
  message: string
  note: string
  openUrl: string | null
}) {
  root.innerHTML = `
    <header class="popup-header">
      <h1 class="popup-title">
        <span class="popup-title-emoji">🦒</span>Giraffe mood refresh
      </h1>
      <div class="popup-sub">
        a little companion for the page you are reading
      </div>
    </header>

    <section class="panel">
      <div class="giraffe-stage">
        <canvas
          class="giraffe-canvas"
          id="giraffe"
          width="240"
          height="160"
          role="button"
          aria-label="Tap the giraffe"
          tabindex="0"
        ></canvas>
        <div class="giraffe-tag">
          <span class="giraffe-tag-label">mood</span>
          <span class="giraffe-tag-value" id="moodLabel">
            ${state.mood}
          </span>
        </div>
      </div>

      <div class="controls">
        <div class="control-row">
          <button
            class="action-button"
            id="snapshotBtn"
            ${state.saving ? 'disabled' : ''}
          >
            ${state.saving
              ? 'snapshotting…'
              : state.saved
                ? 'snapshot saved'
                : 'capture this page'}
          </button>
          <span class="hint">save a reading snapshot locally</span>
        </div>

        <div class="mood-grid" id="moodGrid"></div>

        <div class="control-row">
          <span class="control-label">reading help</span>
          <div class="preset-row" id="presetRow">
            <button
              class="preset-chip ${state.preset === 'soft' ? 'active' : ''}"
              data-preset="soft"
              type="button"
            >soft</button>
            <button
              class="preset-chip ${state.preset === 'plain' ? 'active' : ''}"
              data-preset="plain"
              type="button"
            >plain</button>
            <button
              class="preset-chip ${state.preset === 'highcontrast' ? 'active' : ''}"
              data-preset="highcontrast"
              type="button"
            >high contrast</button>
          </div>
        </div>

        <div class="control-row">
          <button
            class="action-button secondary"
            id="applyReadingHelp"
            type="button"
          >apply reading help</button>
          <button
            class="action-button secondary"
            id="removeReadingHelp"
            type="button"
          >remove reading help</button>
        </div>
      </div>
    </section>

    ${
      state.message
        ? `<div class="message">${state.message}</div>`
        : ''
    }

    <section class="panel snapshot-panel">
      <div class="control-row">
        <span class="control-label">note for this snapshot</span>
        <input
          class="note-input"
          id="noteInput"
          type="text"
          placeholder="optional, stored only on this device"
          maxlength="300"
          value="${state.note}"
        />
      </div>

      <div class="snapshot-list" id="snapshotList">
        ${
          state.snapshots.length === 0
            ? '<div class="snapshot-empty">No reading snapshots yet.</div>'
            : state.snapshots
                .map((s) => {
                  const d = new Date(s.takenAt)
                  const label = d.toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                  return `
                    <div class="snapshot-row">
                      <button
                        class="snapshot-link"
                        type="button"
                        data-url="${s.url}"
                      >
                        <span class="snapshot-title">
                          ${s.title || 'Reading snapshot'}
                        </span>
                        <span class="snapshot-meta">${label}</span>
                      </button>
                      <button
                        class="snapshot-delete"
                        type="button"
                        data-id="${s.id}"
                        aria-label="Delete snapshot"
                      >×</button>
                    </div>
                  `
                })
                .join('')
        }
      </div>
    </section>

    ${
      state.openUrl
        ? `<a class="open-link" href="${state.openUrl}" target="_blank" rel="noopener">open this page</a>`
        : ''
    }

    <footer class="popup-footer">
      <span>local only</span>
      <span>v1.0.0</span>
    </footer>
  `

  const moodGrid = root.querySelector('#moodGrid')!
  for (const m of MOODS) {
    moodGrid.append(
      moodChip(m, state.mood === m, () => setState({ mood: m })),
    )
  }

  const presetRow = root.querySelector('#presetRow')!
  presetRow.addEventListener('click', (event) => {
    const btn = (
      event.target as HTMLElement
    ).closest('.preset-chip') as HTMLButtonElement | null
    if (!btn) return
    const preset = btn.dataset.preset as 'soft' | 'plain' | 'highcontrast'
    setState({ preset })
  })

  const noteInput = root.querySelector('#noteInput') as HTMLInputElement | null
  if (noteInput) {
    noteInput.addEventListener('input', () =>
      setState({ note: noteInput.value }),
    )
  }

  const snapshotList = root.querySelector('#snapshotList')!
  snapshotList.addEventListener('click', (event) => {
    const del = (
      event.target as HTMLElement
    ).closest('.snapshot-delete') as HTMLButtonElement | null
    if (del && del.dataset.id) {
      const id = del.dataset.id
      state.snapshots = state.snapshots.filter((s) => s.id !== id)
      giraffeSaveSnapshot({
        id,
        url: '',
        title: '',
        takenAt: 0,
        note: '',
      } as unknown as Snapshot).catch(() => {})
      render(root, state)
      return
    }
    const link = (
      event.target as HTMLElement
    ).closest('.snapshot-link') as HTMLButtonElement | null
    if (link && link.dataset.url) {
      state.openUrl = link.dataset.url
      render(root, state)
    }
  })
}

function setState(
  partial:
    | Partial<{
        mood: GiraffeMood
        playful: boolean
        preset: 'soft' | 'plain' | 'highcontrast'
        snapshots: Snapshot[]
        saving: boolean
        saved: boolean
        message: string
        note: string
        openUrl: string | null
      }>
    | ((state: typeof stateStore) => void),
) {
  if (typeof partial === 'function') {
    partial(stateStore)
  } else {
    Object.assign(stateStore, partial)
  }
  render(rootEl, stateStore)
}

const rootEl = document.getElementById('root')!
const stateStore = {
  mood: 'calm' as GiraffeMood,
  playful: false,
  preset: 'soft' as 'soft' | 'plain' | 'highcontrast',
  snapshots: [] as Snapshot[],
  saving: false,
  saved: false,
  message: '',
  note: '',
  openUrl: null as string | null,
}

function giraffeFrame(t: number) {
  const canvas = document.getElementById('giraffe') as HTMLCanvasElement | null
  if (!canvas) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = 240
  const h = 160
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, w, h)

  const colors = MOOD_COLORS[stateStore.mood]
  const cx = w / 2
  const baseY = h * 0.62
  const playful = stateStore.playful
  const earWobble = playful ? Math.sin(t * 0.02) * 4 : 0
  const headBob = playful ? Math.sin(t * 0.025) * 3 : 0
  const tailSway = playful ? Math.sin(t * 0.04) * 6 : 0

  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.ellipse(cx, baseY, 46, 30, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = 'rgba(0,0,0,0.18)'
  const spots: Array<[number, number]> = [
    [-20, -12],
    [-6, -18],
    [14, -16],
    [26, -4],
    [-30, 2],
    [6, 6],
    [-10, 12],
  ]
  for (const [sx, sy] of spots) {
    ctx.beginPath()
    ctx.ellipse(cx + sx, baseY + sy, 4, 3, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.moveTo(cx - 16, baseY - 22)
  ctx.lineTo(cx - 22 + earWobble, baseY - 70 - headBob)
  ctx.lineTo(cx + 22 + earWobble, baseY - 70 - headBob)
  ctx.lineTo(cx + 16, baseY - 22)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.ellipse(cx + earWobble * 0.4, baseY - 74 - headBob, 26, 20, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = colors.body
  ctx.lineWidth = 4
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(cx - 12 + earWobble * 0.4, baseY - 86 - headBob)
  ctx.lineTo(cx - 16 + earWobble * 0.4, baseY - 98 - headBob)
  ctx.moveTo(cx + 12 + earWobble * 0.4, baseY - 86 - headBob)
  ctx.lineTo(cx + 16 + earWobble * 0.4, baseY - 98 - headBob)
  ctx.stroke()
  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.arc(cx - 16 + earWobble * 0.4, baseY - 98 - headBob, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 16 + earWobble * 0.4, baseY - 98 - headBob, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = colors.body
  ctx.beginPath()
  ctx.ellipse(cx - 26 + earWobble, baseY - 72 - headBob, 10, 6, -0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 26 + earWobble, baseY - 72 - headBob, 10, 6, 0.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFF6E9'
  ctx.beginPath()
  ctx.ellipse(cx - 9 + earWobble * 0.4, baseY - 76 - headBob, 4.5, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(cx + 9 + earWobble * 0.4, baseY - 76 - headBob, 4.5, 6, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#F4E6D3'
  ctx.beginPath()
  ctx.ellipse(cx + earWobble * 0.4, baseY - 64 - headBob, 12, 8, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#7a4a2c'
  ctx.lineWidth = 2
  ctx.beginPath()
  const smileY = baseY - 62 - headBob
  ctx.moveTo(cx - 5 + earWobble * 0.4, smileY + 1)
  ctx.quadraticCurveTo(cx + earWobble * 0.4, smileY + 7, cx + 5 + earWobble * 0.4, smileY + 1)
  ctx.stroke()

  ctx.fillStyle = '#2A2A2A'
  ctx.beginPath()
  ctx.arc(cx - 5 + earWobble * 0.4, baseY - 78 - headBob, 2.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.arc(cx + 5 + earWobble * 0.4, baseY - 78 - headBob, 2.4, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = colors.body
  ctx.lineWidth = 9
  ctx.lineCap = 'round'
  for (let i = -1; i <= 1; i += 2) {
    const lx = cx + i * 22
    const swing = playful ? Math.sin(t * 0.03 + i) * 3 : 0
    ctx.beginPath()
    ctx.moveTo(lx - 3, baseY + 24)
    ctx.lineTo(lx + swing, baseY + 24 + 34)
    ctx.stroke()
  }

  ctx.strokeStyle = colors.body
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.moveTo(cx + 44, baseY - 6)
  ctx.quadraticCurveTo(cx + 58 + tailSway, baseY - 16, cx + 62 + tailSway, baseY - 4)
  ctx.stroke()
  ctx.fillStyle = '#F4E6D3'
  ctx.beginPath()
  ctx.arc(cx + 62 + tailSway, baseY - 4, 4, 0, Math.PI * 2)
  ctx.fill()

  if (playful) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    for (let i = 0; i < 5; i++) {
      const angle = t * 0.01 + i * 1.3
      const r = 50 + Math.sin(t * 0.05 + i) * 12
      const sx = cx + (Math.cos(angle) * r || 0)
      const sy = (baseY - 40 + Math.sin(angle) * r * 0.4) || 0
      const size = 2 + Math.sin(t * 0.05 + i * 2) * 1.5
      ctx.beginPath()
      ctx.arc(sx, sy, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function animateGiraffe() {
  let raf = 0
  let start = performance.now()
  const loop = (now: number) => {
    giraffeFrame(now - start)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  const el = document.getElementById('giraffe') as HTMLCanvasElement | null
  if (el) {
    const onTap = (event: MouseEvent | TouchEvent) => {
      event.preventDefault()
      stateStore.playful = true
      render(rootEl, stateStore)
      setTimeout(() => {
        stateStore.playful = false
        render(rootEl, stateStore)
      }, 500)
    }
    el.addEventListener('pointerdown', onTap)
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onTap(event as unknown as MouseEvent)
      }
    })
  }
  return () => cancelAnimationFrame(raf)
}

async function refresh() {
  const { giraffe: raw } = await browser.storage.local.get('giraffe')
  const state = currentGiraffe(raw)
  const snaps = await giraffeGetSnapshots()
  setState({
    mood: state.mood,
    preset: state.readingPreset,
    snapshots: snaps,
  })
}

async function takeSnapshot() {
  const btn = rootEl.querySelector<HTMLButtonElement>('#snapshotBtn')
  if (!btn) return
  btn.disabled = true
  btn.textContent = 'snapshotting…'
  stateStore.saving = true
  stateStore.saved = false
  stateStore.message = ''
  render(rootEl, stateStore)

  try {
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    })
    const active = tabs[0]
    if (!active || !active.url) {
      stateStore.message = 'Open a website first.'
      stateStore.saving = false
      render(rootEl, stateStore)
      return
    }
    const url = new URL(active.url)
    if (!['https:', 'http:'].includes(url.protocol)) {
      stateStore.message =
        'Only regular web pages can be snapshotted.'
      stateStore.saving = false
      render(rootEl, stateStore)
      return
    }

    interface SnapshotFrame {
      ok?: boolean
      excerpt?: string
      frame?: { blob: Blob; width: number; height: number } | null
    }

    let result: SnapshotFrame = {}
    try {
      const exec = await browser.scripting.executeScript({
        target: { tabId: active.id! },
        func: async (): Promise<SnapshotFrame> => {
          const excerpt = csMainTextExcerpt()
          const frame = await csCapturePageFrame()
          return { ok: true, excerpt, frame }
        },
      })
      const first = exec[0]
      if (first?.result) {
        result = first.result as SnapshotFrame
      }
    } catch (err) {
      console.error(err)
      result = {}
    }

    const snap: Snapshot = {
      id: crypto.randomUUID(),
      url: active.url.replace(/#.*$/, '').replace(/\?.*$/, ''),
      title:
        active.title?.trim().slice(0, 200) || url.hostname,
      takenAt: Date.now(),
      note: stateStore.note.trim().slice(0, 300),
    }

    await giraffeSaveSnapshot(snap)
    stateStore.snapshots = [
      snap,
      ...stateStore.snapshots.filter((s) => s.id !== snap.id),
    ]
    stateStore.saved = true
    stateStore.message = snap.note
      ? 'Snapshot with note saved.'
      : 'Snapshot saved.'
  } catch (err) {
    console.error(err)
    stateStore.message = 'Snapshot failed.'
  }

  stateStore.saving = false
  render(rootEl, stateStore)
}

rootEl.addEventListener('click', async (event) => {
  const btn = (
    event.target as HTMLElement
  ).closest('button')
  if (!btn) return
  if (btn.id === 'snapshotBtn') {
    await takeSnapshot()
    return
  }
  if (btn.id === 'applyReadingHelp') {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      const tab = tabs[0]
      if (!tab?.id) {
        stateStore.message = 'Open a website first.'
      } else {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: csApplyReadingHelp,
          args: [stateStore.mood, stateStore.preset],
        })
        stateStore.message = 'Reading help on.'
      }
    } catch (err) {
      console.error(err)
      stateStore.message = 'Could not apply reading help on this page.'
    }
    render(rootEl, stateStore)
    return
  }
  if (btn.id === 'removeReadingHelp') {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      })
      const tab = tabs[0]
      if (!tab?.id) {
        stateStore.message = 'Open a website first.'
      } else {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          func: csRemoveReadingHelp,
        })
        stateStore.message = 'Reading help off.'
      }
    } catch (err) {
      console.error(err)
      stateStore.message = 'Could not remove reading help on this page.'
    }
    render(rootEl, stateStore)
    return
  }
  const chip = (
    event.target as HTMLElement
  ).closest('.mood-chip') as HTMLButtonElement | null
  if (chip && chip.title) {
    await giraffeSetMood(chip.title as GiraffeMood)
    setState({ mood: chip.title as GiraffeMood })
  }
})

const cleanup = animateGiraffe()
await refresh()
window.addEventListener('beforeunload', cleanup, { once: true })

export {}
