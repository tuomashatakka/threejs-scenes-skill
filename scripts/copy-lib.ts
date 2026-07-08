// scripts/copy-lib.ts
// Copies the built library (dist/) into the vite public assets
// (site/public/lib/dist/) so the Pages demos import a local, version-matched
// copy via importmap. Build output only — never committed. The skill bundle
// does NOT get a copy: its templates import the published npm package from
// esm.sh, version-pinned by scripts/sync-version.ts. Runs automatically after
// `bun run build`.

import { cp, rm, mkdir } from 'node:fs/promises'


const distSrc = new URL('../dist/', import.meta.url)
const dest    = new URL('../site/public/lib/dist/', import.meta.url)

await rm(dest, { recursive: true, force: true })
await mkdir(new URL('./', dest), { recursive: true })
await cp(distSrc, dest, { recursive: true })

// Vendor the frame-loop dependency next to dist so the demos' importmaps can
// resolve the bare '@tuomashatakka/canvas-loop-framecapper' specifier without
// a registry.
const vendorSrc  = new URL('../node_modules/@tuomashatakka/canvas-loop-framecapper/dist/', import.meta.url)
const vendorDest = new URL('../site/public/lib/vendor/canvas-loop-framecapper/', import.meta.url)

await rm(vendorDest, { recursive: true, force: true })
await mkdir(vendorDest, { recursive: true })
await cp(vendorSrc, vendorDest, { recursive: true })

console.log('copy-lib: dist/ -> site/public/lib/dist/ (+ vendor/canvas-loop-framecapper)')
