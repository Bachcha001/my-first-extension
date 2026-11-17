export type GiraffeMood = 'calm' | 'playful' | 'cozy' | 'focused'

export type GiraffeState = {
  mood: GiraffeMood
  lastVisitAt: number
  readingPreset: 'soft' | 'plain' | 'highcontrast'
}

export type Snapshot = {
  id: string
  url: string
  title: string
  takenAt: number
  note: string
}

export const MOODS: GiraffeMood[] = ['calm', 'playful', 'cozy', 'focused']

export const MOOD_COLORS: Record<GiraffeMood, { body: string; overlay: string; text: string }> = {
  calm: { body: '#E8C49A', overlay: 'rgba(232, 196, 154, 0.10)', text: '#2A2A2A' },
  playful: { body: '#F4A26B', overlay: 'rgba(244, 162, 107, 0.14)', text: '#2A2A2A' },
  cozy: { body: '#D48C5E', overlay: 'rgba(212, 140, 94, 0.16)', text: '#FBF3EA' },
  focused: { body: '#7FA69A', overlay: 'rgba(127, 166, 154, 0.12)', text: '#FBF6F2' },
}

export const MAX_SNAPSHOTS = 30

export function currentGiraffe(stored: unknown): GiraffeState {
  const base: GiraffeState = {
    mood: 'calm',
    lastVisitAt: 0,
    readingPreset: 'soft',
  }
  if (!stored || typeof stored !== 'object') return base
  const s = stored as Record<string, unknown>
  if (typeof s.mood !== 'string' || !MOODS.includes(s.mood as GiraffeMood)) return base
  const out: GiraffeState = {
    mood: s.mood as GiraffeMood,
    lastVisitAt: Number.isFinite(Number(s.lastVisitAt)) ? Number(s.lastVisitAt) : 0,
    readingPreset:
      s.readingPreset === 'plain' || s.readingPreset === 'highcontrast' ? s.readingPreset : 'soft',
  }
  return out
}

export function touchGiraffe(state: GiraffeState): GiraffeState {
  return { ...state, lastVisitAt: Date.now() }
}

export function snapshotFromTab(
  tab: { url?: string; title?: string },
  now = Date.now(),
): Snapshot {
  if (!tab.url) throw new Error('Open a website and tap the giraffe to snapshot it.')
  const url = new URL(tab.url)
  if (!['https:', 'http:'].includes(url.protocol)) {
    throw new Error('Only regular website pages can be snapshotted.')
  }
  const stripped = tab.url.replace(/#.*$/, '').replace(/\?.*$/, '')
  return {
    id: crypto.randomUUID(),
    url: stripped || url.href,
    title: tab.title?.trim().slice(0, 200) || url.hostname,
    takenAt: now,
    note: '',
  }
}

export function readSnapshots(value: unknown): Snapshot[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Snapshot => {
      if (!item || typeof item !== 'object') return false
      const s = item as Record<string, unknown>
      if (typeof s.id !== 'string' || typeof s.url !== 'string' || typeof s.title !== 'string') {
        return false
      }
      if (!Number.isFinite(Number(s.takenAt))) return false
      try {
        return ['http:', 'https:'].includes(new URL(s.url).protocol)
      } catch {
        return false
      }
    })
    .slice(0, MAX_SNAPSHOTS)
}

export function addSnapshot(snapshots: Snapshot[], snapshot: Snapshot): Snapshot[] {
  const next = [snapshot, ...snapshots.filter((s) => s.id !== snapshot.id)]
  if (next.length > MAX_SNAPSHOTS) next.length = MAX_SNAPSHOTS
  return next
}
