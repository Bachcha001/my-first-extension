import { browser } from 'wxt/browser'
import { currentGiraffe, readSnapshots } from '../lib/giraffe'
import {
  giraffeSetMood,
  giraffeUseReadingPreset,
  giraffeSaveSnapshot,
  giraffeGetSnapshots,
} from '../lib/giraffe-api'
import type { Snapshot } from '../lib/giraffe'

const KEY_GIRAFFE = 'giraffe'
const KEY_SNAPSHOTS = 'snapshots'

async function updateBadge() {
  const { [KEY_SNAPSHOTS]: raw } = await browser.storage.local.get(KEY_SNAPSHOTS)
  const snapshots = readSnapshots(raw)
  await browser.action.setBadgeBackgroundColor({ color: '#7A5A3C' })
  await browser.action.setBadgeText({
    text: snapshots.length ? `🍃${snapshots.length}` : '',
  })
}

export default defineBackground(async () => {
  await browser.storage.local.set({
    [KEY_GIRAFFE]: currentGiraffe(
      (await browser.storage.local.get(KEY_GIRAFFE))[KEY_GIRAFFE],
    ),
    [KEY_SNAPSHOTS]: readSnapshots(
      (await browser.storage.local.get(KEY_SNAPSHOTS))[KEY_SNAPSHOTS],
    ),
  })

  browser.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes[KEY_GIRAFFE] || changes[KEY_SNAPSHOTS])) {
      void updateBadge().catch(() =>
        console.error('Could not update the giraffe badge.'),
      )
    }
  })

  await updateBadge()

  browser.runtime.onMessage.addListener(async (msg): Promise<unknown> => {
    if (!msg || typeof msg !== 'object') return {}

    const m = msg as {
      type?: string
      mood?: 'calm' | 'playful' | 'cozy' | 'focused'
      preset?: 'soft' | 'plain' | 'highcontrast'
      snapshot?: Snapshot
    }

    if (m.type === 'setMood' && typeof m.mood === 'string') {
      await giraffeSetMood(m.mood)
      return { ok: true }
    }
    if (m.type === 'useReadingPreset' && typeof m.preset === 'string') {
      await giraffeUseReadingPreset(m.preset)
      return { ok: true }
    }
    if (m.type === 'saveSnapshot' && m.snapshot) {
      await giraffeSaveSnapshot(m.snapshot)
      return { ok: true }
    }
    if (m.type === 'getSnapshots') {
      return { snapshots: await giraffeGetSnapshots() }
    }
    return {}
  })
})
