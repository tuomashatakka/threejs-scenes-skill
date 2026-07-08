// scripts/package-skill.ts
// Packages skill/ into threejs-scenes.skill — a zip that extracts to
// threejs-scenes/, matching the installable skill bundle layout. Validates
// SKILL.md frontmatter and the built lib copy first so a broken bundle can't
// ship. Run `bun run package:skill` (builds first); CI uses the same script.

import { existsSync } from 'node:fs'
import { readFile, readdir, rm, cp } from 'node:fs/promises'
import { $ } from 'bun'


const root = new URL('../', import.meta.url).pathname

// 1. SKILL.md must exist with name + description frontmatter
const packageJson = JSON.parse(await readFile(`${root}package.json`, 'utf8')) as { version?: string }
const skillMd     = await readFile(`${root}skill/SKILL.md`, 'utf8')
const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)
if (!frontmatter)
  throw new Error('package-skill: skill/SKILL.md has no frontmatter block')
for (const field of [ 'name:', 'version:', 'description:' ])
  if (!frontmatter[1]!.includes(field))
    throw new Error(`package-skill: SKILL.md frontmatter missing "${field}"`)
const skillVersion = frontmatter[1]!.match(/^version:\s*([^\n]+)$/m)?.[1]?.trim()
if (skillVersion !== packageJson.version)
  throw new Error(`package-skill: SKILL.md version (${skillVersion ?? 'missing'}) must match package.json version (${packageJson.version ?? 'missing'})`)

// 2. the skill must not vendor the library — templates import the published
//    package from esm.sh, pinned to the current version
if (existsSync(`${root}skill/lib`))
  throw new Error('package-skill: skill/lib exists — the skill must not bundle the library; delete it')
const pin = `@tuomashatakka/threejs-scenes@${packageJson.version}`
for (const f of await readdir(`${root}skill/templates`)) {
  if (!f.endsWith('.html'))
    continue
  const html = await readFile(`${root}skill/templates/${f}`, 'utf8')
  if (html.includes('esm.sh/@tuomashatakka/threejs-scenes@') && !html.includes(pin))
    throw new Error(`package-skill: templates/${f} pins a stale library version — expected ${pin} (run scripts/sync-version.ts)`)
}

// 3. stage as threejs-scenes/ and zip
const staging = `${root}threejs-scenes`
await rm(staging, { recursive: true, force: true })
await cp(`${root}skill`, staging, { recursive: true })
await $ `find ${staging} -name .DS_Store -delete`.quiet()
await rm(`${root}threejs-scenes.skill`, { force: true })
await $ `cd ${root} && zip -r -X -q threejs-scenes.skill threejs-scenes`
await rm(staging, { recursive: true, force: true })

console.log('package-skill: threejs-scenes.skill written')
