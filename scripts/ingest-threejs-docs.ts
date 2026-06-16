#!/usr/bin/env bun
/**
 * ingest-threejs-docs.ts
 * ----------------------
 * Crawls the entire three.js documentation (API reference) and manual and
 * digests every page into clean Markdown using a local Ollama model
 * (default qwen3:4b). Modeled on ingest-threejs-resource.ts.
 *
 * Sources (the live docs endpoints were restructured):
 *
 *   docs   -> the API reference pages now live as flat HTML files in the
 *             canonical GitHub repo at docs/pages/<PageName>.html. The old
 *             nested docs/list.json (paths like api/en/cameras/PerspectiveCamera)
 *             is dead: threejs.org/docs/list.json serves a redirect HTML page
 *             and GitHub raw docs/list.json is 404. The page list is instead
 *             enumerated from the repo tree (docs/pages/*.html).
 *
 *   manual -> threejs.org/manual/list.json still works (a nested object keyed
 *             by language; leaf string values are paths like en/installation).
 *             Page content is served live at threejs.org/manual/<path>.html
 *             (verified 200, real HTML). English only by default; use --filter
 *             to pull other languages.
 *
 * Output mirrors the source tree:
 *   digests/threejs-docs/<path>.md
 *   digests/threejs-manual/<path>.md
 * with a top-level INDEX.md in each. RESUMABLE: pages whose .md already exists
 * are skipped unless --force.
 *
 * Usage:
 *   bun run scripts/ingest-threejs-docs.ts [docs|manual|all] [options]
 *
 * Options:
 *   --source <s>      docs | manual | all (default: all; also positional)
 *   --model <name>    Ollama model tag (default: qwen3:4b)
 *   --out <dir>       Output root (default: digests)
 *   --host <url>      Ollama host (default: http://127.0.0.1:11434)
 *   --ref <branch>    GitHub ref for docs pages (default: dev; falls back master)
 *   --filter <sub>    Only ingest paths containing this substring
 *   --limit <n>       Cap number of pages processed
 *   --concurrency <n> Pages digested in parallel (default: 2)
 *   --force           Re-digest even if the output .md already exists
 *   --dry             Fetch + parse only; skip the model (writes raw extracted text)
 *   --md              Fetch the maintainers' pre-rendered markdown directly, no
 *                     model: docs pages have a clean <Name>.html.md in the repo;
 *                     manual pages have none, so fall back to HTML extraction.
 *                     Fast (minutes) and highest fidelity. Recommended for docs.
 */

const OLLAMA_DEFAULT = 'http://127.0.0.1:11434'
const THREE_ORIGIN   = 'https://threejs.org'
const GH_RAW         = 'https://raw.githubusercontent.com/mrdoob/three.js'
const GH_API         = 'https://api.github.com/repos/mrdoob/three.js'

type Source = 'docs' | 'manual' | 'all'

interface Options {
  source:      Source
  model:       string
  out:         string
  host:        string
  ref:         string
  filter:      string
  limit:       number
  concurrency: number
  force:       boolean
  dry:         boolean
  md:          boolean
}

interface ExtractedPage {
  path:   string // source-relative path, doubles as the output path (without .md)
  title:  string
  source: string // the meaningful text fed to the model
  url:    string
  kind:   'docs' | 'manual'
}

function parseArgs (argv: string[]): Options {
  const positional = argv.filter(a => !a.startsWith('--'))
  const flag       = (name: string, fallback: string): string => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback
  }
  const rawSource = flag('source', positional[0] ?? 'all')
  const source    = rawSource === 'docs' || rawSource === 'manual' ? rawSource : 'all'
  return {
    source,
    model:       flag('model', 'qwen3:4b'),
    out:         flag('out', 'digests'),
    host:        flag('host', OLLAMA_DEFAULT),
    ref:         flag('ref', 'dev'),
    filter:      flag('filter', ''),
    limit:       Number(flag('limit', '0')) || 0,
    concurrency: Math.max(1, Number(flag('concurrency', '2')) || 2),
    force:       argv.includes('--force'),
    dry:         argv.includes('--dry'),
    md:          argv.includes('--md'),
  }
}

const sleep = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

// -- fetch helpers --------------------------------------------------
async function getText (url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'user-agent': 'threejs-scenes-ingest/1.0' }})
  if (!res.ok)
    throw new Error(`fetch ${url} -> ${res.status}`)
  return res.text()
}

async function getJson<T> (url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'user-agent': 'threejs-scenes-ingest/1.0' }})
  if (!res.ok)
    throw new Error(`fetch ${url} -> ${res.status}`)
  return res.json() as Promise<T>
}

// -- HTML -> meaningful source extraction ---------------------------
// Doc/manual pages are prose + code. Keep <pre>/<code> blocks intact (as fenced
// markdown) and strip the rest down to readable text. The model then flattens
// any leftover three.js doc tokens ([page:], [property:], etc.).
type ExtractSourceReturnType = { title: string, source: string }

function extractSource (html: string): ExtractSourceReturnType {
  const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '')
    .replace(/\s*[-–]\s*Three\.js.*/i, '')
    .trim()

  // isolate <body> when present, otherwise use the whole document
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html

  // protect code blocks before tag-stripping
  const blocks: string[] = []
  const withBlocks       = body
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner: string) => {
      const code = inner
        .replace(/<[^>]+>/g, '')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim()
      blocks.push(code)
      return ` BLOCK${blocks.length - 1} `
    })

  let text = withBlocks
    .replace(/<[^>]+>/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim()

  // re-inject code blocks as fenced markdown
  text = text.replace(/ BLOCK(\d+) /g, (_m, i: string) =>
    `\n\n\`\`\`js\n${blocks[Number(i)]}\n\`\`\`\n\n`)

  return { title, source: text }
}

// -- source enumeration ---------------------------------------------
interface TreeEntry { path: string }
interface TreeResponse { tree: TreeEntry[], truncated: boolean }

async function listDocPaths (opts: Options): Promise<string[]> {
  // The page list comes from the repo tree: docs/pages/<Name>.html. The old
  // nested list.json scheme is gone. Try the requested ref, fall back to master.
  const refs = opts.ref === 'master' ? [ 'master', 'dev' ] : [ opts.ref, 'master' ]
  let tree: TreeEntry[] | undefined
  let usedRef = ''
  for (const ref of refs)
    try {
      const json = await getJson<TreeResponse>(`${GH_API}/git/trees/${ref}?recursive=1`)
      tree    = json.tree
      usedRef = ref
      break
    }
    catch (err) {
      console.warn(`  docs list via ${ref}: ${(err as Error).message}`)
    }
  if (!tree)
    throw new Error('could not fetch docs page tree from GitHub')
  opts.ref = usedRef // remember which ref resolved, for page fetches
  return tree
    .map(t => t.path)
    .filter(p => p.startsWith('docs/pages/') && p.endsWith('.html') && !p.endsWith('.html.md'))
    .map(p => p.slice('docs/pages/'.length, -'.html'.length))
    .sort()
}

async function listManualPaths (): Promise<string[]> {
  const list             = await getJson<Record<string, unknown>>(`${THREE_ORIGIN}/manual/list.json`)
  const leaves: string[] = []
  const walk             = (node: unknown): void => {
    if (typeof node === 'string') {
      if (node)
        leaves.push(node)
    }
    else if (node && typeof node === 'object')
      for (const v of Object.values(node as Record<string, unknown>))
        walk(v)
  }
  // default to English only; --filter can re-include the others
  walk((list as Record<string, unknown>).en)
  return [ ...new Set(leaves) ].sort()
}

// -- Ollama digest --------------------------------------------------
const SYSTEM_PROMPT = `You are a precise technical writer documenting the three.js library.
You are given the extracted text of a single three.js documentation page (either an API reference class or a manual article).
Produce clean, faithful Markdown that a developer can read and use. Output ONLY Markdown - no preamble, no code fences wrapping the whole document.

The source may contain three.js doc tokens. Expand them into readable Markdown:
  [page:Object3D]            -> Object3D                 (a cross-reference; render as plain text or a backticked name)
  [page:Float x]             -> x
  [property:Float x]         -> **x** : Float
  [method:Vector3 clone]     -> **.clone() : Vector3**
  [param:Float radius]       -> radius : Float           (inline in signatures)
  [example:webgl_foo title]  -> title                    (drop the example id)
  [link:https://... label]   -> [label](https://...)
Never leave a raw [token:...] in the output. Preserve all code blocks exactly as fenced \`\`\`js blocks.

Choose the structure that fits the page:

API REFERENCE CLASS - use:
  # ClassName
  one-line inheritance chain if present (e.g. *Object3D -> Camera -> PerspectiveCamera*)
  a short prose description
  ## Code Example  (if the page has one)
  ## Constructor   - signature + each parameter as **name** : Type - description
  ## Properties    - each as **.name** : Type - description (note defaults)
  ## Methods       - each as **.name( args ) : ReturnType** - description
  Omit any section the page does not have.

MANUAL ARTICLE - use:
  # Article Title
  faithful prose with the original headings as ## / ### and code as fenced blocks.

Be faithful to the source. Do not invent properties, methods, parameters, or APIs that are not present.`

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
  const kind = page.kind === 'docs' ? 'API reference page' : 'manual article'
  const user = `This is a three.js ${kind}.\nTitle: ${page.title || page.path}\nSource URL: ${page.url}\n\nPage text:\n\n${page.source}\n\n/no_think`
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
    throw new Error(`ollama ${opts.model} -> ${res.status}: ${await res.text()}`)

  const json = await res.json() as { response?: string }
  return stripThinking(json.response ?? '')
}

// -- per-source ingestion -------------------------------------------
interface SourceSpec {
  kind:    'docs' | 'manual'
  outDir:  string
  paths:   string[]
  pageUrl: (path: string) => string
  mdUrl?:  (path: string) => string // pre-rendered markdown (docs only)
}

async function buildSpec (kind: 'docs' | 'manual', opts: Options): Promise<SourceSpec> {
  if (kind === 'docs') {
    const paths = await listDocPaths(opts)
    return {
      kind,
      outDir:  `${opts.out}/threejs-docs`,
      paths,
      pageUrl: p => `${GH_RAW}/${opts.ref}/docs/pages/${p}.html`,
      mdUrl:   p => `${GH_RAW}/${opts.ref}/docs/pages/${p}.html.md`,
    }
  }

  const paths = await listManualPaths()
  return {
    kind,
    outDir:  `${opts.out}/threejs-manual`,
    paths,
    pageUrl: p => `${THREE_ORIGIN}/manual/${p}.html`,
  }
}

async function ingestSource (spec: SourceSpec, opts: Options): Promise<void> {
  const fs       = await import('node:fs/promises')
  const nodePath = await import('node:path')

  let paths = spec.paths
  if (opts.filter)
    paths = paths.filter(p => p.includes(opts.filter))
  if (opts.limit > 0)
    paths = paths.slice(0, opts.limit)

  console.log(`\n[${spec.kind}] ${spec.paths.length} pages total` +
    `${opts.filter ? ` - ${paths.length} after filter "${opts.filter}"` : ''}` +
    `${opts.limit > 0 ? ` - capped to ${paths.length}` : ''}`)

  await fs.mkdir(spec.outDir, { recursive: true })

  const indexRows: string[] = []
  let done    = 0
  let skipped = 0
  const queue = [ ...paths ]

  async function worker (): Promise<void> {
    for (let path = queue.shift(); path; path = queue.shift()) {
      const outPath = `${spec.outDir}/${path}.md`
      const url     = spec.pageUrl(path)

      if (!opts.force) {
        const exists = await fs.access(outPath).then(() => true, () => false)
        if (exists) {
          indexRows.push(`- [${path}](${path}.md)`)
          console.log(`  . skip (cached) ${path}`)
          skipped++
          continue
        }
      }

      if (opts.md) {
        try {
          await sleep(150)
          // direct markdown: docs ship a pre-rendered <Name>.html.md in the
          // repo; manual has none, so fall back to HTML extraction (still no model).
          const body   = spec.mdUrl
            ? await getText(spec.mdUrl(path))
            : extractSource(await getText(url)).source
          const srcUrl = spec.mdUrl ? spec.mdUrl(path) : url
          await fs.mkdir(nodePath.dirname(outPath), { recursive: true })
          await fs.writeFile(outPath,
                             `<!-- ingested from ${srcUrl} (direct markdown, no model) -->\n\n${body}\n`)
          indexRows.push(`- [${path}](${path}.md)`)
          console.log(`  md ${++done}/${paths.length}  ${path}`)
        }
        catch (err) {
          console.warn(`  x ${path}: ${(err as Error).message}`)
        }
        continue
      }

      try {
        await sleep(200) // polite crawl delay

        const html                = await getText(url)
        const { title, source }   = extractSource(html)
        const page: ExtractedPage = { path, title, source, url, kind: spec.kind }

        const body = opts.dry
          ? `# ${title || path}\n\nSource: ${url}\n\n${source}\n`
          : await digest(page, opts)

        await fs.mkdir(nodePath.dirname(outPath), { recursive: true })
        await fs.writeFile(outPath,
                           `<!-- ingested from ${url} via ${opts.dry ? 'dry-run' : opts.model} -->\n\n${body}\n`)
        indexRows.push(`- [${title || path}](${path}.md)`)
        console.log(`  ok ${++done}/${paths.length}  ${path}`)
      }
      catch (err) {
        console.warn(`  x ${path}: ${(err as Error).message}`)
      }
    }
  }

  await Promise.all(Array.from({ length: opts.concurrency }, () => worker()))

  indexRows.sort()

  const heading = spec.kind === 'docs' ? 'three.js API reference' : 'three.js manual'
  await fs.writeFile(`${spec.outDir}/INDEX.md`,
                     `# ${heading}\n\n${indexRows.join('\n')}\n`)
  console.log(`[${spec.kind}] done: ${done} digested, ${skipped} cached -> ${spec.outDir}/`)
}

// -- orchestration --------------------------------------------------
async function run (): Promise<void> {
  const opts                         = parseArgs(process.argv.slice(2))
  const kinds: ('docs' | 'manual')[] =
    opts.source === 'all' ? [ 'docs', 'manual' ] : [ opts.source ]

  for (const kind of kinds) {
    const spec = await buildSpec(kind, opts)
    await ingestSource(spec, opts)
  }
}

run().catch(err => {
  console.error(err); process.exit(1)
})
