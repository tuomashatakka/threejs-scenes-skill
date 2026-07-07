// site/src/main.ts
import demoJson from './generated/demo-data.json'
import libraryJson from './generated/library-data.json'
import skillJson from './generated/skill-data.json'
import { attachPlayground } from './playground'
import './styles.css'

import type { DemoData, DemoInfo, LibraryData, LibraryExport, LibraryModule, SkillCase, SkillData } from './types'


const libraryData = libraryJson as LibraryData
const skillData = skillJson as SkillData
const demoData = demoJson as DemoData
const app = document.querySelector<HTMLElement>('#app')
const baseUrl = import.meta.env.BASE_URL

if (!app)
  throw new Error('site: #app root missing')

function pathFromBase (path: string): string {
  if (path.startsWith(baseUrl))
    return '/' + path.slice(baseUrl.length).replace(/^\/+/, '')
  return path
}

function currentRoute (): 'home' | 'library' | 'skill' | 'api' {
  const path = pathFromBase(window.location.pathname)
  if (path.startsWith('/skill'))
    return 'skill'
  if (path.startsWith('/api'))
    return 'api'
  if (path.startsWith('/library'))
    return 'library'
  return 'home'
}

function href (path: string): string {
  if (path === '/')
    return baseUrl
  return `${baseUrl}${path.replace(/^\//, '')}`
}

function asset (path: string): string {
  return `${baseUrl}${path.replace(/^\//, '')}`
}

function escapeHtml (value: unknown): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeJson (value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
}

function slug (value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function nav (): string {
  const route = currentRoute()
  const link = (target: 'home' | 'library' | 'skill' | 'api', path: string, label: string) =>
    `<a href="${href(path)}"${route === target ? ' aria-current="page"' : ''}>${label}</a>`
  return `<nav aria-label="primary">
    ${link('home', '/', 'overview')}
    ${link('library', '/library/', 'library')}
    ${link('skill', '/skill/', 'skill')}
    ${link('api', '/api/', 'api')}
    <a href="${asset('llms.txt')}">llms.txt</a>
    <a href="https://github.com/tuomashatakka/threejs-scenes-skill">source</a>
  </nav>`
}

function shell (title: string, kicker: string, body: string, headerExtra = ''): string {
  return `<header>
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(kicker)}</p>
    ${headerExtra}
    ${nav()}
  </header>
  <main id="main">
    ${body}
  </main>
  <footer>
    <p>generated from package declarations and skill references. public downloads stay tokenless: <a href="${asset('threejs-scenes.skill')}">skill</a> and <a href="${asset('threejs-scenes.tgz')}">npm tarball</a>.</p>
  </footer>`
}

function statList (): string {
  return `<dl data-stats>
    <div><dt>${libraryData.totals.exports}</dt><dd>public exports</dd></div>
    <div><dt>${libraryData.totals.playable}</dt><dd>playgrounds</dd></div>
    <div><dt>${skillData.cases.length}</dt><dd>skill cases</dd></div>
    <div><dt>${demoData.demos.length}</dt><dd>standalone demos</dd></div>
  </dl>`
}

function demoButtonList (demos: readonly DemoInfo[], selected = 0): string {
  return `<div role="tablist" aria-label="demo selector" data-demo-tabs>
    ${demos.map((demo, index) => `<button type="button" role="tab" aria-selected="${index === selected}" data-demo="${escapeHtml(demo.slug)}">${escapeHtml(demo.label)}</button>`).join('')}
  </div>`
}

function demoPreview (demos = demoData.demos.slice(0, 9)): string {
  const first = demos[0] ?? demoData.demos[0]
  return `<section id="demos" aria-labelledby="demos-title" data-demo-preview>
    <div data-section-head>
      <h2 id="demos-title">live demos</h2>
      <p>pick a scene from the tab bar to load it full-width below. feature demos import the library from a local, version-pinned copy via importmap.</p>
    </div>
    ${demoButtonList(demos)}
    <figure>
      <iframe title="live demo preview" src="${asset(`demos/${first.slug}.html`)}" data-demo-frame></iframe>
      <figcaption data-demo-caption>${escapeHtml(first.caption)}</figcaption>
    </figure>
  </section>`
}

function renderHome (): string {
  const headerExtra = `<p><code>npm install @tuomashatakka/threejs-scenes</code> (github packages) - or, with no token at all:</p>
    <p><code>npm install https://tuomashatakka.github.io/threejs-scenes-skill/threejs-scenes.tgz</code></p>
    <p data-actions>
      <a href="${href('/library/')}">full library reference</a>
      <a href="${href('/skill/')}">skill cases</a>
      <a href="${asset('threejs-scenes.skill')}">download the <code>.skill</code> package</a>
      <a href="${asset('threejs-scenes.tgz')}">download the npm tarball</a>
      <a href="https://github.com/tuomashatakka/threejs-scenes-skill/releases/latest">latest release</a>
      <a href="https://github.com/tuomashatakka/threejs-scenes-skill">source on github</a>
      <a href="${asset('llms.txt')}">llms.txt</a>
    </p>`
  const body = `<section aria-labelledby="overview-title" data-split>
    <article data-panel>
      <p>library</p>
      <h2 id="overview-title">typed three.js factories with runnable export docs</h2>
      <p>browse ${libraryData.totals.exports} generated public exports across ${libraryData.totals.modules} package entrypoints. function, class, and const exports get live playgrounds; type exports get declarations and samples.</p>
      <p><a href="${href('/library/')}">open library docs</a></p>
    </article>
    <article data-panel>
      <p>skill</p>
      <h2>production scene cases and reusable scripts</h2>
      <p>walk the skill by task: minimal scenes, cameras, instancing, particles, post-fx, voxels, jsx, performance, and llm-codegen schemas.</p>
      <p><a href="${href('/skill/')}">open skill cases</a></p>
    </article>
  </section>
  ${statList()}
  ${demoPreview(demoData.demos.slice(0, 12))}
  <section aria-labelledby="downloads-title">
    <div data-section-head>
      <p>downloads</p>
      <h2 id="downloads-title">tokenless downloads</h2>
    </div>
    <ul data-link-list>
      <li><a href="${asset('threejs-scenes.skill')}">threejs-scenes.skill</a></li>
      <li><a href="${asset('threejs-scenes.tgz')}">threejs-scenes.tgz</a></li>
      <li><a href="${asset('api.html')}">api.html compatibility redirect</a></li>
      <li><a href="${asset('sitemap.xml')}">sitemap.xml</a></li>
    </ul>
  </section>`
  return shell(
    'threejs-scenes',
    'strictly-typed factories and interfaces for production vanilla three.js scenes - renderer scaffolding, procedural generation, geometry, materials, props, animation, cameras, instancing, lighting, particles, post-processing, voxels, a context-injection architecture, and a reactive jsx layer.',
    body,
    headerExtra,
  )
}

function moduleTabs (): string {
  return `<nav aria-label="library modules" data-local-nav>
    ${libraryData.modules.map(module => `<a href="#${slug(module.id)}">${escapeHtml(module.title)}</a>`).join('')}
  </nav>`
}

function relatedDemoLinks (entry: LibraryExport): string {
  return `<p data-related>${entry.relatedDemos.map(demo => `<a href="${asset(`demos/${demo}.html`)}">${escapeHtml(demo)}</a>`).join(' ')}</p>`
}

function exportCard (module: LibraryModule, entry: LibraryExport): string {
  const id = `${slug(module.id)}-${slug(entry.name)}`
  const seed = entry.playSeed
  const play = seed
    ? `<button type="button" data-play-export aria-expanded="false" aria-controls="${id}-play">play</button>
      <script type="application/json" data-play-seed>${escapeJson(seed)}</script>`
    : `<span data-type-badge>type reference</span>`
  const sample = entry.coverage === 'type-reference'
    ? `<pre><code>${escapeHtml(entry.sample)}</code></pre>`
    : ''
  return `<article id="${id}" data-export-card data-search-text="${escapeHtml(`${module.specifier} ${entry.name} ${entry.kind} ${entry.doc} ${entry.signature}`)}">
    <header>
      <p>${escapeHtml(module.specifier)}</p>
      <h3><code>${escapeHtml(entry.name)}</code> <span>${escapeHtml(entry.kind)}</span></h3>
      ${play}
    </header>
    ${entry.doc ? `<p>${escapeHtml(entry.doc)}</p>` : entry.summary ? `<p>${escapeHtml(entry.summary)}</p>` : '<p>generated declaration coverage; no doc comment was present.</p>'}
    <pre><code>${escapeHtml(entry.signature)}</code></pre>
    ${sample}
    ${relatedDemoLinks(entry)}
  </article>`
}

function moduleSection (module: LibraryModule): string {
  return `<section id="${slug(module.id)}" aria-labelledby="${slug(module.id)}-title" data-module-section>
    <div data-section-head>
      <p>${escapeHtml(module.specifier)}</p>
      <h2 id="${slug(module.id)}-title">${escapeHtml(module.title)}</h2>
      <p>${escapeHtml(module.desc)}</p>
    </div>
    ${module.example ? `<pre><code>${escapeHtml(module.example)}</code></pre>` : ''}
    <p data-count>${module.exports.length} exports, ${module.exports.filter(item => item.playSeed).length} playgrounds</p>
    <div data-card-grid>
      ${module.exports.map(entry => exportCard(module, entry)).join('')}
    </div>
  </section>`
}

function renderLibrary (asApi = false): string {
  const body = `<section aria-labelledby="library-title">
    <div data-section-head>
      <p>${asApi ? 'api alias' : 'library'}</p>
      <h2 id="library-title">${asApi ? 'api reference' : 'generated package reference'}</h2>
      <p>generated from package exports only: ${libraryData.modules.map(module => `<code>${escapeHtml(module.subpath)}</code>`).join(' ')}.</p>
    </div>
    ${statList()}
    <form role="search" data-search-form>
      <label for="export-search">filter exports</label>
      <input id="export-search" name="q" type="search" placeholder="try emitter, bloom, jsx, voxel..." autocomplete="off">
    </form>
    ${moduleTabs()}
  </section>
  ${libraryData.modules.map(moduleSection).join('')}
  <p data-no-results hidden>no matching exports.</p>`
  return shell(asApi ? 'api reference' : 'library reference', `${libraryData.totals.exports} generated exports`, body)
}

function caseArticle (item: SkillCase): string {
  const demos = item.demos.length
    ? item.demos.map(demo => `<a href="${asset(`demos/${demo}.html`)}">${escapeHtml(demo)}</a>`).join(' ')
    : '<span>schema sample only</span>'
  return `<article data-case-card id="${slug(item.id)}">
    <header>
      <p>${escapeHtml(item.demoMode)}</p>
      <h3>${escapeHtml(item.title)}</h3>
    </header>
    <p>${escapeHtml(item.summary)}</p>
    <p data-tags>${item.tags.map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}</p>
    <dl>
      <div><dt>demos</dt><dd>${demos}</dd></div>
      <div><dt>refs</dt><dd>${item.refs.map(ref => `<code>${escapeHtml(ref)}</code>`).join(' ')}</dd></div>
      <div><dt>scripts</dt><dd>${item.scripts.map(script => `<code>${escapeHtml(script)}</code>`).join(' ')}</dd></div>
    </dl>
    <ul>
      ${item.checklist.map(check => `<li>${escapeHtml(check)}</li>`).join('')}
    </ul>
  </article>`
}

function renderSkill (): string {
  const body = `<section aria-labelledby="skill-title">
    <div data-section-head>
      <p>${escapeHtml(skillData.skill.name)}</p>
      <h2 id="skill-title">cases, references, scripts</h2>
      <p>${escapeHtml(skillData.skill.description)}</p>
    </div>
    <dl data-stats>
      <div><dt>${skillData.cases.length}</dt><dd>cases</dd></div>
      <div><dt>${skillData.coverage.references.covered}/${skillData.coverage.references.total}</dt><dd>references covered</dd></div>
      <div><dt>${skillData.coverage.scripts.covered}/${skillData.coverage.scripts.total}</dt><dd>scripts covered</dd></div>
      <div><dt>${demoData.demos.length}</dt><dd>public demos reused</dd></div>
    </dl>
  </section>
  <section aria-labelledby="cases-title">
    <div data-section-head>
      <p>skill cases</p>
      <h2 id="cases-title">task-first map</h2>
    </div>
    <div data-card-grid>
      ${skillData.cases.map(caseArticle).join('')}
    </div>
  </section>
  ${demoPreview(demoData.demos)}
  <section aria-labelledby="refs-title">
    <div data-section-head>
      <p>references</p>
      <h2 id="refs-title">all reference files</h2>
    </div>
    <div data-list-grid>
      ${skillData.references.map(ref => `<article>
        <h3><code>${escapeHtml(ref.file)}</code></h3>
        <p>${escapeHtml(ref.summary || ref.title)}</p>
      </article>`).join('')}
    </div>
  </section>
  <section aria-labelledby="scripts-title">
    <div data-section-head>
      <p>scripts</p>
      <h2 id="scripts-title">template implementations</h2>
    </div>
    <table>
      <thead><tr><th scope="col">script</th><th scope="col">category</th><th scope="col">purpose</th><th scope="col">reference</th></tr></thead>
      <tbody>
        ${skillData.scripts.map(script => `<tr>
          <th scope="row"><code>${escapeHtml(script.file)}</code></th>
          <td>${escapeHtml(script.category)}</td>
          <td>${escapeHtml(script.purpose)}</td>
          <td><code>${escapeHtml(script.reference)}</code>${script.exists ? '' : ' missing'}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </section>`
  return shell('skill cases', `v${skillData.version} skill package`, body)
}

function setupDemoTabs (): void {
  const tabs = app.querySelector<HTMLElement>('[data-demo-tabs]')
  const frame = app.querySelector<HTMLIFrameElement>('[data-demo-frame]')
  const caption = app.querySelector<HTMLElement>('[data-demo-caption]')
  if (!tabs || !frame || !caption)
    return

  tabs.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element))
      return
    const button = target.closest<HTMLButtonElement>('button[data-demo]')
    if (!button)
      return
    const slugValue = button.dataset.demo
    const demo = demoData.demos.find(item => item.slug === slugValue)
    if (!demo)
      return
    for (const item of tabs.querySelectorAll<HTMLButtonElement>('button[data-demo]'))
      item.setAttribute('aria-selected', String(item === button))
    frame.src = asset(`demos/${demo.slug}.html`)
    caption.textContent = demo.caption
  })
}

function setupSearch (): void {
  const input = app.querySelector<HTMLInputElement>('#export-search')
  if (!input)
    return
  const cards = [ ...app.querySelectorAll<HTMLElement>('[data-export-card]') ]
  const empty = app.querySelector<HTMLElement>('[data-no-results]')
  input.addEventListener('input', () => {
    const query = input.value.trim().toLowerCase()
    let visible = 0
    for (const card of cards) {
      const matches = !query || (card.dataset.searchText ?? '').toLowerCase().includes(query)
      card.hidden = !matches
      if (matches)
        visible += 1
    }
    if (empty)
      empty.hidden = visible > 0
  })
}

function render (): void {
  const route = currentRoute()
  document.title = route === 'skill'
    ? 'skill - threejs-scenes'
    : route === 'library'
      ? 'library - threejs-scenes'
      : route === 'api'
        ? 'api - threejs-scenes'
        : 'threejs-scenes'
  app.innerHTML = route === 'skill'
    ? renderSkill()
    : route === 'library'
      ? renderLibrary()
      : route === 'api'
        ? renderLibrary(true)
        : renderHome()
  setupDemoTabs()
  setupSearch()
  window.__SITE_READY__ = true
}

declare global {
  interface Window {
    __SITE_READY__?: boolean
  }
}

attachPlayground(app, {
  modules: libraryData.modules,
  baseUrl,
})
render()
