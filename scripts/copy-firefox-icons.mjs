import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(__dirname, '../entrypoints/icons')
const dest = join(__dirname, '../.output/firefox-mv3/icons')

try {
  mkdirSync(dest, { recursive: true })
  for (const name of readdirSync(src)) {
    cpSync(join(src, name), join(dest, name), { recursive: true })
  }
  console.log('copied icons into', dest)
} catch (err) {
  console.error('failed to copy icons:', err)
  process.exitCode = 1
}
