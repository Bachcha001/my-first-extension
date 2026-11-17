import {
  currentGiraffe,
  touchGiraffe,
  readSnapshots,
  addSnapshot,
  MOODS,
  type GiraffeMood,
  type Snapshot,
} from './giraffe'
import { browser } from 'wxt/browser'

const KEY_GIRAFFE = 'giraffe'
const KEY_SNAPSHOTS = 'snapshots'

export async function giraffeSetMood(mood: GiraffeMood) {
  if (!MOODS.includes(mood)) return
  const { [KEY_GIRAFFE]: raw } = await browser.storage.local.get(KEY_GIRAFFE)
  const state = currentGiraffe(raw)
  await browser.storage.local.set({ [KEY_GIRAFFE]: { ...state, mood } })
}

export async function giraffeUseReadingPreset(
  preset: 'soft' | 'plain' | 'highcontrast',
) {
  const { [KEY_GIRAFFE]: raw } = await browser.storage.local.get(KEY_GIRAFFE)
  const state = currentGiraffe(raw)
  await browser.storage.local.set({ [KEY_GIRAFFE]: { ...state, readingPreset: preset } })
}

export async function giraffeSaveSnapshot(snapshot: Snapshot) {
  const { [KEY_SNAPSHOTS]: raw } = await browser.storage.local.get(KEY_SNAPSHOTS)
  const snapshots = addSnapshot(readSnapshots(raw), snapshot)
  await browser.storage.local.set({ [KEY_SNAPSHOTS]: snapshots })
  await browser.action.setBadgeText({
    text: snapshots.length ? `🍃${snapshots.length}` : '',
  })
}

export async function giraffeGetSnapshots() {
  const { [KEY_SNAPSHOTS]: raw } = await browser.storage.local.get(KEY_SNAPSHOTS)
  return readSnapshots(raw)
}

export async function giraffeCurrentState() {
  const { [KEY_GIRAFFE]: raw } = await browser.storage.local.get(KEY_GIRAFFE)
  return currentGiraffe(raw)
}

export async function giraffeTouch() {
  const { [KEY_GIRAFFE]: raw } = await browser.storage.local.get(KEY_GIRAFFE)
  const state = currentGiraffe(raw)
  await browser.storage.local.set({ [KEY_GIRAFFE]: touchGiraffe(state) })
}
