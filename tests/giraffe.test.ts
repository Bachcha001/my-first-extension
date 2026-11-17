import { expect, test } from 'bun:test'
import {
  MAX_SNAPSHOTS,
  MOODS,
  addSnapshot,
  currentGiraffe,
  readSnapshots,
  snapshotFromTab,
  touchGiraffe,
} from '../lib/giraffe'

test('stored giraffe state falls back to a sane default', () => {
  expect(currentGiraffe(undefined)).toEqual({
    mood: 'calm',
    lastVisitAt: 0,
    readingPreset: 'soft',
  })
  expect(currentGiraffe('nonsense').mood).toBe('calm')
  expect(currentGiraffe({ mood: 'angry' }).mood).toBe('calm')
  expect(currentGiraffe({ mood: 'cozy' }).mood).toBe('cozy')
  expect(currentGiraffe({ mood: 'cozy', readingPreset: 'nope' }).readingPreset).toBe(
    'soft',
  )
  expect(
    currentGiraffe({ mood: 'focused', readingPreset: 'highcontrast' })
      .readingPreset,
  ).toBe('highcontrast')
  for (const mood of MOODS) {
    expect(currentGiraffe({ mood }).mood).toBe(mood)
  }
})

test('touching the giraffe records the visit without changing the mood', () => {
  const state = currentGiraffe({ mood: 'playful' })
  const touched = touchGiraffe(state)
  expect(touched.mood).toBe('playful')
  expect(touched.lastVisitAt).toBeGreaterThan(0)
})

test('only regular web pages can be snapshotted', () => {
  const snap = snapshotFromTab(
    { url: 'https://example.com/a?b=1#c', title: '  A page  ' },
    1,
  )
  expect(snap.url).toBe('https://example.com/a')
  expect(snap.title).toBe('A page')
  expect(snap.takenAt).toBe(1)
  expect(snap.note).toBe('')
  expect(typeof snap.id).toBe('string')

  expect(snapshotFromTab({ url: 'https://example.com' }, 1).title).toBe(
    'example.com',
  )

  for (const url of [
    'about:blank',
    'chrome://extensions',
    'javascript:alert(1)',
    'file:///tmp/file',
  ]) {
    expect(() => snapshotFromTab({ url })).toThrow('Only regular website')
  }
  expect(() => snapshotFromTab({})).toThrow('Open a website')
})

test('malformed stored snapshots never resurface as links', () => {
  expect(readSnapshots(undefined)).toEqual([])
  expect(
    readSnapshots([
      { id: 'a', url: 'javascript:alert(1)', title: 'Bad', takenAt: 1 },
      null,
      {},
      { id: 'b', url: 'https://ok.example', title: 'Good', takenAt: 1, note: '' },
    ]),
  ).toEqual([
    { id: 'b', url: 'https://ok.example', title: 'Good', takenAt: 1, note: '' },
  ])
})

test('snapshots deduplicate and stay bounded', () => {
  let list = Array.from({ length: MAX_SNAPSHOTS }, (_, i) => ({
    id: `id-${i}`,
    url: `https://example.com/${i}`,
    title: `Page ${i}`,
    takenAt: i,
    note: '',
  }))

  const nudged = addSnapshot(list, { ...list[3]!, note: 'updated' })
  expect(nudged).toHaveLength(MAX_SNAPSHOTS)
  expect(nudged[0]!.note).toBe('updated')
  expect(nudged.filter((s) => s.id === 'id-3')).toHaveLength(1)

  list = addSnapshot(list, {
    id: 'fresh',
    url: 'https://new.example',
    title: 'New',
    takenAt: 99,
    note: '',
  })
  expect(list).toHaveLength(MAX_SNAPSHOTS)
  expect(list[0]!.id).toBe('fresh')
})
