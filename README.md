# Giraffe mood refresh

A small Firefox/Chromium extension built with [WXT](https://wxt.dev): a mood-refreshing
giraffe that keeps you company while you read, plus a local reading helper and a
reading-snapshot list.

Everything stays on your device. There is no account, no sync, no analytics and no
network request.

## What it does

- **Giraffe toy** — an animated canvas giraffe in the popup. Tap it and it wiggles.
  Pick one of four moods (calm, playful, cozy, focused); the giraffe recolours and the
  choice is remembered in this browser profile.
- **Reading help** — injects a stylesheet into the active tab on demand to widen the
  measure, quiet the page and tint text for the current mood. Three presets: `soft`,
  `plain`, `high contrast`. Remove it again with one tap.
- **Reading snapshots** — records the page title, URL, an excerpt of the main text and
  an optional note, capped at the 30 most recent. The toolbar badge counts them.
- **Badge** — shows how many snapshots are stored.

## Permissions

| Permission | Why |
| --- | --- |
| `activeTab` | Read the current tab when you open the popup or tap an action |
| `storage` | Keep mood and snapshots in `browser.storage.local` |
| `scripting` | Inject the reading-help stylesheet on demand |

There are no host permissions and no always-on content scripts: page access only
happens when you invoke the extension.

## Start and check

```sh
npm install
npm run dev          # WXT development browser
npm test             # unit tests for the stored-state helpers
npm run typecheck    # wxt prepare && tsc --noEmit
npm run build        # Chromium MV3 build
npm run build:firefox
```

The popup only works as a real installed extension; opening `popup.html` as a plain
web page gives it no browser APIs and no access to the active tab.

## Testing on Firefox Nightly for Android

```sh
npm run build:firefox
```

This builds `.output/firefox-mv3` and copies the icon set into it (WXT does not emit
manifest icons for the Firefox target, so `scripts/copy-firefox-icons.mjs` does it).
To sideload, zip the contents of `.output/firefox-mv3` and load it from the Nightly
add-ons debug page, or copy the folder to the device and install it as a temporary
add-on. Note that Firefox requires an explicit extension ID for MV3 packaging, so add
`browser_specific_settings.gecko.id` in `wxt.config.ts` before publishing to AMO.

Known limitation: canvas reads (used by the frame capture) are blocked by some sites;
snapshots still record the excerpt, title and note in that case.

## Layout

- `entrypoints/popup/` — popup markup, behaviour and styles
- `entrypoints/background.ts` — storage initialisation, badge, message routing
- `entrypoints/icons/` — generated icon set
- `lib/giraffe.ts` — moods, state and snapshot helpers (pure, unit-tested)
- `lib/giraffe-api.ts` — storage-backed helpers
- `lib/content-script.ts` — reading-help styling and text extraction, injected on demand
- `scripts/make-icons.ts` — regenerates the icons (`npx tsx scripts/make-icons.ts`)

Saved data never leaves the browser profile. Nothing here needs a backend or hosting.
