#!/usr/bin/env node
// query-threejs-docs.js
// ---------------------
// Ready-to-run CLI for querying the live three.js documentation. No
// dependencies — runs with `node` (>= 18) or `bun`. Instead of shipping a
// digested copy of the docs, this script fetches exactly the page or section
// a task needs, from the maintained sources:
//
//   https://threejs.org/llms.txt               tiny entry point
//   https://threejs.org/docs/llms.txt          LLM guidelines + curated API index
//   https://threejs.org/docs/llms-full.txt     guidelines + full TSL reference + page catalog
//   https://threejs.org/docs/pages/<Name>.html.md   per-class markdown (API reference)
//   https://threejs.org/manual/list.json       manual table of contents
//   https://threejs.org/manual/<path>.html     manual articles (HTML)
//
// Usage:
//   node query-threejs-docs.js page <Name>            # per-class markdown, e.g. page InstancedMesh
//   node query-threejs-docs.js list [filter]          # catalog of every .html.md page name
//   node query-threejs-docs.js sections               # list llms-full.txt section headings
//   node query-threejs-docs.js section <heading>      # print one llms-full.txt section, e.g. section Uniform
//   node query-threejs-docs.js search <term...>       # search llms-full.txt + page names
//   node query-threejs-docs.js manual [path]          # list manual paths, or fetch one (e.g. manual en/fundamentals)
//   node query-threejs-docs.js llms                   # print docs/llms.txt (compact LLM guidelines)
//
// Responses are cached in the OS temp dir for 24 h so repeated queries in one
// session stay fast and polite to threejs.org.

import { mkdir, readFile, writeFile, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ORIGIN    = 'https://threejs.org'
const CACHE_DIR = join(tmpdir(), 'threejs-docs-cache')
const CACHE_TTL = 24 * 60 * 60 * 1000

async function cachedFetch (url) {
  await mkdir(CACHE_DIR, { recursive: true })
  const key  = join(CACHE_DIR, url.replace(/[^a-z0-9.]+/gi, '_'))
  const meta = await stat(key).catch(() => null)
  if (meta && Date.now() - meta.mtimeMs < CACHE_TTL)
    return readFile(key, 'utf8')
  const res = await fetch(url, { headers: { 'user-agent': 'threejs-scenes-skill-docs/1.0' }})
  if (!res.ok)
    throw new Error(`fetch ${url} -> ${res.status}`)
  const text = await res.text()
  await writeFile(key, text)
  return text
}

const llmsFull = () => cachedFetch(`${ORIGIN}/docs/llms-full.txt`)

// -- page catalog: parse the "Available Documentation" links ---------
async function pageCatalog () {
  const full  = await llmsFull()
  const names = [ ...full.matchAll(/docs\/pages\/([A-Za-z0-9_.-]+)\.html\.md/g) ].map(m => m[1])
  return [ ...new Set(names) ].sort()
}

// -- llms-full.txt sections ------------------------------------------
function splitSections (full) {
  const sections = []
  let current    = null
  for (const line of full.split('\n')) {
    const h = line.match(/^(#{1,2}) (.+)$/)
    if (h) {
      current = { heading: h[2].trim(), lines: [ line ] }
      sections.push(current)
    }
    else if (current)
      current.lines.push(line)
  }
  return sections
}

// -- HTML -> text for manual articles --------------------------------
function htmlToText (html) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html
  return body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, code) => `\n\`\`\`js\n${code.replace(/<[^>]+>/g, '')}\n\`\`\`\n`)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
}

// -- commands ---------------------------------------------------------
const commands = {

  async page ([ name ]) {
    if (!name)
      throw new Error('usage: page <Name>   (e.g. page InstancedMesh — case-sensitive; try `list <filter>` first)')
    console.log(await cachedFetch(`${ORIGIN}/docs/pages/${name}.html.md`))
  },

  async list ([ filter ]) {
    const names = await pageCatalog()
    const hits  = filter ? names.filter(n => n.toLowerCase().includes(filter.toLowerCase())) : names
    for (const n of hits)
      console.log(`${n}  ->  ${ORIGIN}/docs/pages/${n}.html.md`)
    console.error(`\n${hits.length}/${names.length} pages`)
  },

  async sections () {
    for (const s of splitSections(await llmsFull()))
      console.log(s.heading)
  },

  async section ([ ...words ]) {
    const query = words.join(' ').toLowerCase()
    if (!query)
      throw new Error('usage: section <heading>   (see `sections` for the list)')
    const sections = splitSections(await llmsFull())
    const hit      = sections.find(s => s.heading.toLowerCase() === query)
      ?? sections.find(s => s.heading.toLowerCase().includes(query))
    if (!hit)
      throw new Error(`no llms-full.txt section matches "${query}"`)
    console.log(hit.lines.join('\n').trim())
  },

  async search (terms) {
    if (!terms.length)
      throw new Error('usage: search <term...>')
    const needle = terms.join(' ').toLowerCase()

    const pages = (await pageCatalog()).filter(n => n.toLowerCase().includes(needle))
    if (pages.length) {
      console.log('## Matching API pages\n')
      for (const n of pages)
        console.log(`- ${n}  ->  ${ORIGIN}/docs/pages/${n}.html.md`)
    }

    const lines = (await llmsFull()).split('\n')
    const hits  = []
    lines.forEach((line, i) => {
      if (line.toLowerCase().includes(needle))
        hits.push(`${String(i + 1).padStart(5)}: ${line.trim()}`)
    })
    if (hits.length) {
      console.log('\n## Matching llms-full.txt lines\n')
      for (const h of hits.slice(0, 40))
        console.log(h)
      if (hits.length > 40)
        console.log(`… ${hits.length - 40} more (use \`section <heading>\` to read a match in context)`)
    }
    if (!pages.length && !hits.length)
      console.error(`no matches for "${needle}"`)
  },

  async manual ([ path ]) {
    if (!path || path === 'list') {
      const list   = JSON.parse(await cachedFetch(`${ORIGIN}/manual/list.json`))
      const leaves = []
      const walk   = node => {
        if (typeof node === 'string')
          leaves.push(node)
        else if (node && typeof node === 'object')
          Object.values(node).forEach(walk)
      }
      walk(list.en)
      for (const p of [ ...new Set(leaves) ].sort())
        console.log(`en/${p.replace(/^en\//, '')}  ->  ${ORIGIN}/manual/#en/${p.replace(/^en\//, '')}`)
      return
    }
    const slug = path.replace(/^en\//, '')
    console.log(htmlToText(await cachedFetch(`${ORIGIN}/manual/en/${slug}.html`)))
    console.log(`\n---\nsource: ${ORIGIN}/manual/#en/${slug}`)
  },

  async llms () {
    console.log(await cachedFetch(`${ORIGIN}/docs/llms.txt`))
  },
}

const [ cmd, ...args ] = process.argv.slice(2)
const run              = commands[cmd]
if (!run) {
  console.error('usage: query-threejs-docs.js <page|list|sections|section|search|manual|llms> [args]')
  console.error('  page InstancedMesh        per-class API markdown')
  console.error('  list bloom                catalog of .html.md pages (optionally filtered)')
  console.error('  sections                  llms-full.txt section headings')
  console.error('  section render pipeline   one llms-full.txt section (TSL, post-processing, …)')
  console.error('  search compute shader     search pages + llms-full.txt')
  console.error('  manual en/fundamentals    manual article as text (bare `manual` lists paths)')
  console.error('  llms                      compact LLM guidelines (docs/llms.txt)')
  process.exit(1)
}
run(args).catch(err => {
  console.error(err.message ?? err)
  process.exit(1)
})
