// scripts/copy-lib.ts
// Copies the built library (dist/) into the skill AND the public showcase as
// local, version-pinned copies (skill/lib/dist/, public/lib/dist/). Templates
// and demos import three.js-scenes from these local copies via importmap, so
// the skill and the Pages site are self-contained and never depend on a
// published npm version. Runs automatically after `bun run build`.

import { cp, rm, mkdir } from 'node:fs/promises'


const distSrc = new URL('../dist/', import.meta.url)

const targets = [
  new URL('../skill/lib/dist/', import.meta.url),
  new URL('../public/lib/dist/', import.meta.url),
]

for (const dest of targets) {
  await rm(dest, { recursive: true, force: true })
  await mkdir(new URL('./', dest), { recursive: true })
  await cp(distSrc, dest, { recursive: true })
}

console.log('copy-lib: dist/ -> skill/lib/dist/ + public/lib/dist/')
