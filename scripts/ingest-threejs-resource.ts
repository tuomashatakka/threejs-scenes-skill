#!/usr/bin/env bun
/**
 * ingest-threejs-resource.ts
 * ──────────────────────────
 * Fetches content from threejs.org and digests it into clean markdown using a
 * local Ollama model (default qwen3:4b; gemma4:e2b also works).
 *
 * Two input modes, auto-detected from the URL:
 *
 *   1. Examples listing with a query, e.g.
 *        https://threejs.org/examples/?q=webgpu%20postprocessing
 *      → reads examples/files.json, keeps every example whose file key contains
 *        ALL query terms, fetches each standalone example source, and digests
 *        each into its own markdown file.
 *
 *   2. Any single threejs.org page (docs, manual, a specific example .html)
 *      → fetches it and digests the one page.
 *
 * Usage:
 *   bun run scripts/ingest-threejs-resource.ts <url> [options]
 *
 * Options:
 *   --model <name>   Ollama model tag (default: qwen3:4b)
 *   --out <dir>      Output directory (default: digests)
 *   --limit <n>      Cap number of examples processed (listing mode)
 *   --host <url>     Ollama host (default: http://127.0.0.1:11434)
 *   --concurrency 1  Examples digested in parallel (default: 1 — local models are serial)
 *   --dry            Fetch + parse only; skip the model (writes raw extracted source)
 */

const OLLAMA_DEFAULT = 'http://127.0.0.1:11434'
const THREE_ORIGIN   = 'https://threejs.org'

interface Options {
  url:         string
  model:       string
  out:         string
  host:        string
  limit:       number
  concurrency: number
  dry:         boolean
}

interface ExtractedPage {
  key:    string // slug used for the output filename
  title:  string
  source: string // the meaningful code/text fed to the model
  url:    string
}

function parseArgs (argv: string[]): Options {
  const [ url ] = argv.filter(a => !a.startsWith('--'))
  if (!url) {
    console.error('error: provide a threejs.org URL\n  bun run scripts/ingest-threejs-resource.ts <url> [--model qwen3:4b] [--out digests]')
    process.exit(1)
  }
  const flag = (name: string, fallback: string): string => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
  }
  return {
    url,
    model:       flag('model', 'qwen3:4b'),
    out:         flag('out', 'digests'),
    host:        flag('host', OLLAMA_DEFAULT),
    limit:       Number(flag('limit', '0')) || 0,
    concurrency: Math.max(1, Number(flag('concurrency', '1')) || 1),
    dry:         argv.includes('--dry'),
  }
}

// ── fetch helpers ──────────────────────────────────────────────────
async function getText (url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': 'threejs-scenes-ingest/1.0' }})
  if (!res.ok)
    throw new Error(`fetch ${url} → ${res.status}`)
  return res.text()
}

async function getJson<T> (url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'user-agent': 'threejs-scenes-ingest/1.0' }})
  if (!res.ok)
    throw new Error(`fetch ${url} → ${res.status}`)
  return res.json() as Promise<T>
}

// ── HTML → meaningful source extraction ────────────────────────────
// For an example page, the module <script> IS the content worth digesting.
// Fall back to stripped body text for docs/manual pages.
type ExtractSourceReturnType = { title: string, source: string }

function extractSource (html: string): ExtractSourceReturnType {
  const title   = (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim()
  const modules = [ ...html.matchAll(/<script[^>]*type=["']module["'][^>]*>([\s\S]*?)<\/script>/gi) ]
    .map(m => m[1].trim())
    .filter(Boolean)
  if (modules.length)
    return { title, source: modules.join('\n\n/* ── next module ── */\n\n') }

  // docs / manual: drop scripts, styles, tags; collapse whitespace
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()
  return { title, source: text }
}

// ── listing mode: resolve query → example file keys ────────────────
async function resolveExampleKeys (url: URL): Promise<string[]> {
  const query = (url.searchParams.get('q') ?? '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
  const files = await getJson<Record<string, string[]>>(`${THREE_ORIGIN}/examples/files.json`)
  const all   = new Set<string>()
  for (const list of Object.values(files))
    for (const key of list)
      all.add(key)

  // an example matches when its key contains every query term
  const matched = [ ...all ].filter(key => {
    const hay = key.toLowerCase()
    return query.every(term => hay.includes(term))
  })
  matched.sort()
  return matched
}

function isExampleListing (url: URL): boolean {
  return url.hostname.endsWith('threejs.org') &&
    url.pathname.replace(/\/$/, '').endsWith('/examples') &&
    url.searchParams.has('q')
}

// ── Ollama digest ──────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a precise technical writer documenting three.js post-processing examples.
Given the source code of a three.js example, produce concise, accurate Markdown that a developer can use to re-implement the effect.
Output ONLY Markdown — no preamble, no code fences around the whole document.
Structure every digest as:

# <effect name>

**What it does:** one or two sentences.

**Renderer / system:** WebGLRenderer + EffectComposer, or WebGPURenderer + PostProcessing (TSL nodes) — state which.

**Passes / nodes used:** bullet list of the specific passes, shaders, or TSL nodes, with the import path each comes from.

**Key parameters:** bullet list of the tunable uniforms/options and their effect.

**Wiring:** a short fenced code block showing the minimal setup (pass creation + add to composer/pipeline). Keep it under ~25 lines.

**Notes:** gotchas, perf cost, mobile caveats, WebGL-vs-WebGPU differences if relevant.

Be faithful to the source. Do not invent APIs that are not in the code.`

function stripThinking (text: string): string {
  // qwen3/gemma may emit a reasoning block; the final answer follows the last
  // </think>. Take everything after it, then clean any stray tags.
  let t = text
  const close = t.lastIndexOf('</think>')
  if (close >= 0)
    t = t.slice(close + '</think>'.length)
  return t.replace(/<\/?think>/gi, '').trim()
}

async function digest (page: ExtractedPage, opts: Options): Promise<string> {
  // `/no_think` is the qwen3 convention to skip the reasoning pass (faster);
  // harmless to other models. `think: false` is also sent for models that honor it.
  const user = `Example: ${page.title || page.key}\nSource URL: ${page.url}\n\nSource code:\n\n${page.source}\n\n/no_think`
  const res  = await fetch(`${opts.host}/api/generate`, {
    method:  'POST',
    headers: { 'content-type': 'application/json' },
    body:    JSON.stringify({
      model:   opts.model,
      system:  SYSTEM_PROMPT,
      prompt:  user,
      think:   false, // disable qwen3/gemma thinking; we want the answer only
      stream:  false,
      options: { temperature: 0.2, num_ctx: 16384 },
    }),
  })
  if (!res.ok)
    throw new Error(`ollama ${opts.model} → ${res.status}: ${await res.text()}`)

  const json = await res.json() as { response?: string }
  return stripThinking(json.response ?? '')
}

// ── orchestration ──────────────────────────────────────────────────
async function buildPages (opts: Options): Promise<ExtractedPage[]> {
  const url = new URL(opts.url)
  if (isExampleListing(url)) {
    let keys = await resolveExampleKeys(url)
    if (opts.limit > 0)
      keys = keys.slice(0, opts.limit)
    console.log(`listing mode: ${keys.length} examples matched`)

    const pages: ExtractedPage[] = []
    for (const key of keys) {
      const exUrl = `${THREE_ORIGIN}/examples/${key}.html`
      try {
        const html              = await getText(exUrl)
        const { title, source } = extractSource(html)
        pages.push({ key, title, source, url: exUrl })
      }
      catch (err) {
        console.warn(`  skip ${key}: ${(err as Error).message}`)
      }
    }
    return pages
  }

  // single-page mode
  const html              = await getText(opts.url)
  const { title, source } = extractSource(html)
  const key               = url.pathname.replace(/\/+$/, '').split('/')
    .pop() || 'page'
  return [{ key, title, source, url: opts.url }]
}

async function run (): Promise<void> {
  const opts  = parseArgs(process.argv.slice(2))
  const pages = await buildPages(opts)
  if (!pages.length) {
    console.error('no pages to ingest'); process.exit(1)
  }

  const fs = await import('node:fs/promises')
  await fs.mkdir(opts.out, { recursive: true })

  const indexRows: string[] = []
  let done = 0
  // simple bounded-concurrency queue
  const queue = [ ...pages ]
  async function worker (): Promise<void> {
    for (let page = queue.shift(); page; page = queue.shift()) {
      const outPath = `${opts.out}/${page.key}.md`
      try {
        const body = opts.dry
          ? `# ${page.title || page.key}\n\nSource: ${page.url}\n\n\`\`\`js\n${page.source}\n\`\`\`\n`
          : await digest(page, opts)
        await fs.writeFile(outPath, `<!-- ingested from ${page.url} via ${opts.dry ? 'dry-run' : opts.model} -->\n\n${body}\n`)
        indexRows.push(`- [${page.title || page.key}](${page.key}.md)`)
        console.log(`  ✓ ${++done}/${pages.length}  ${page.key}`)
      }
      catch (err) {
        console.warn(`  ✗ ${page.key}: ${(err as Error).message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: opts.concurrency }, () => worker()))

  indexRows.sort()
  await fs.writeFile(`${opts.out}/INDEX.md`, `# Ingested three.js resources\n\n${indexRows.join('\n')}\n`)
  console.log(`\ndone: ${done}/${pages.length} → ${opts.out}/`)
}

run().catch(err => {
  console.error(err); process.exit(1)
})
