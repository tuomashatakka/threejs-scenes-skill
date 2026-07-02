// scripts/package-skill.ts
// Packages skill/ into threejs-scenes.skill — a zip that extracts to
// threejs-scenes/, matching the installable skill bundle layout. Validates
// SKILL.md frontmatter and the built lib copy first so a broken bundle can't
// ship. Run `bun run package:skill` (builds first); CI uses the same script.

import { existsSync } from 'node:fs'
import { readFile, rm, cp } from 'node:fs/promises'
import { $ } from 'bun'


const root = new URL('../', import.meta.url).pathname

// 1. SKILL.md must exist with name + description frontmatter
const skillMd     = await readFile(`${root}skill/SKILL.md`, 'utf8')
const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)
if (!frontmatter)
  throw new Error('package-skill: skill/SKILL.md has no frontmatter block')
for (const field of [ 'name:', 'description:' ])
  if (!frontmatter[1]!.includes(field))
    throw new Error(`package-skill: SKILL.md frontmatter missing "${field}"`)

// 2. the local lib copy the templates import must be built
if (!existsSync(`${root}skill/lib/dist/index.js`))
  throw new Error('package-skill: skill/lib/dist missing — run `bun run build` first')

// 3. stage as threejs-scenes/ and zip
const staging = `${root}threejs-scenes`
await rm(staging, { recursive: true, force: true })
await cp(`${root}skill`, staging, { recursive: true })
await $ `find ${staging} -name .DS_Store -delete`.quiet()
await rm(`${root}threejs-scenes.skill`, { force: true })
await $ `cd ${root} && zip -r -X -q threejs-scenes.skill threejs-scenes`
await rm(staging, { recursive: true, force: true })

console.log('package-skill: threejs-scenes.skill written')
