// scripts/copy-lib.ts
// Copies the built library (dist/) into the skill as a local, version-pinned
// copy (skill/lib/dist/). The skill's templates/demos import three.js-scenes
// from this local copy via importmap, so the skill is self-contained and never
// depends on a published npm version. Run automatically after `bun run build`.

import { cp, rm, mkdir } from 'node:fs/promises'

const distSrc  = new URL('../dist/', import.meta.url)
const skillLib = new URL('../skill/lib/', import.meta.url)
const distDest = new URL('../skill/lib/dist/', import.meta.url)

await rm(distDest, { recursive: true, force: true })
await mkdir(skillLib, { recursive: true })
await cp(distSrc, distDest, { recursive: true })

console.log('copy-lib: dist/ -> skill/lib/dist/')
