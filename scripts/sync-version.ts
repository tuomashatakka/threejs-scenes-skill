// scripts/sync-version.ts
// Syncs skill/SKILL.md's frontmatter `version:` to package.json's version.
// Run via the npm `version` lifecycle hook so `npm version <bump>` keeps
// both in lockstep — package-skill.ts fails the build otherwise.

import { readFile, writeFile } from 'node:fs/promises'

const root = new URL('../', import.meta.url).pathname

const packageJson = JSON.parse(await readFile(`${root}package.json`, 'utf8')) as { version?: string }
if (!packageJson.version)
  throw new Error('sync-version: package.json has no version')

const skillMdPath = `${root}skill/SKILL.md`
const skillMd     = await readFile(skillMdPath, 'utf8')
const frontmatter = skillMd.match(/^---\n([\s\S]*?)\n---/)
if (!frontmatter)
  throw new Error('sync-version: skill/SKILL.md has no frontmatter block')
if (!/^version:\s*[^\n]+$/m.test(frontmatter[1]!))
  throw new Error('sync-version: skill/SKILL.md frontmatter missing "version:"')

const updated = skillMd.replace(/^version:\s*[^\n]+$/m, `version: ${packageJson.version}`)
await writeFile(skillMdPath, updated)

console.log(`sync-version: skill/SKILL.md -> ${packageJson.version}`)
