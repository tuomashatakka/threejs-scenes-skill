// scripts/generate-docs.ts
// Generates the API reference from the built dist/ .d.ts files:
//   1. readme.md         — comprehensive per-module reference between
//                          <!-- api:begin --> / <!-- api:end --> markers
//   2. public/api.html   — full reference page: every export with its exact
//                          declaration, doc comment, per-module example code
//                          and a live demo preview iframe
// Run after `bun run build` (needs fresh dist/). Wired into `bun run docs`.

import ts from 'typescript'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'


const root = fileURLToPath(new URL('..', import.meta.url))

interface ModuleMeta {
  entry:    string
  desc:     string
  demo?:    string
  example?: string
}

// Subpath modules, in exports-map order. desc/example/demo are hand-curated;
// export lists and signatures come from the .d.ts files.
const MODULES: Record<string, ModuleMeta> = {
  core: {
    entry: 'dist/core/index.d.ts',
    demo:  'bootstrap',
    desc:  'Scene scaffolding: renderer factory, the canvas-loop-framecapper-backed frame loop, unidirectional app shell, injectable clocks, stores, overlays, pointer gestures, disposal and device-tier quality presets.',
    example: `import { createApp, createClock } from '@tuomashatakka/threejs-scenes'

const app = createApp({
  canvas,
  seed:  7,
  clock: createClock({ mode: 'fixed' }),   // deterministic sim steps
  state: { hue: 0.52 },
  modules: [{ id: 'spin', update: ({ scene }, { delta }) => { /* project state -> scene */ } }],
})
app.start()`,
  },
  camera: {
    entry: 'dist/camera/index.d.ts',
    demo:  'follow-camera',
    desc:  'Camera factories: multi-mode controller (free / flyTo / follow / cockpit) with serializable tuple targets, orthographic isometric rig, framerate-independent third-person follow camera.',
    example: `const cam = createCameraController(camera, { bounds: null })
cam.flyTo([0, 8, 24], [0, 0, 0], { fov: 40, onArrive: () => cam.follow(ship) })
loop.onFrame(ctx => cam.update(ctx))`,
  },
  instancing: {
    entry: 'dist/instancing/index.d.ts',
    demo:  'instanced-field',
    desc:  'Draw-call reduction: seeded InstancedMesh scatter fields and BatchedMesh building batches.',
    example: `const field = createInstancedField(geometry, material, {
  count: 5000, radius: 40, seed: 7, hueRange: [0.5, 0.65],
})
scene.add(field.mesh)`,
  },
  materials: {
    entry: 'dist/materials/index.d.ts',
    demo:  'materials',
    desc:  'Material factories and presets: standard PBR, toon and holographic (fresnel + scanlines) materials with a userData.tick(elapsed) animation convention.',
    example: `const holo = createHolographicMaterial({ color: '#79f7ff', fresnelStrength: 2 })
loop.onFrame(({ elapsed }) => holo.userData.tick?.(elapsed))`,
  },
  geometry: {
    entry: 'dist/geometry/index.d.ts',
    demo:  'geometry',
    desc:  'Programmatic mesh generation: 2D shape builders, extrusion/lathe, in-place vertex deformers, mesh merging, layout helpers, kNN connection graphs and recentering infinite ground tiles.',
    example: `const gear = createExtrudedMesh(gearShape({ teeth: 12, radius: 1 }), material, { depth: 0.3 })
applyTwist(gear.geometry, { angle: Math.PI / 6 })`,
  },
  loaders: {
    entry: 'dist/loaders/index.d.ts',
    desc:  'Asset loading with progress aggregation, draco/ktx2 wiring and dispose-safe caches.',
  },
  animation: {
    entry: 'dist/animation/index.d.ts',
    demo:  'animation',
    desc:  'Animation controllers: clip playback with crossfades, tweens, easing curves and per-frame drivers registered on the frame loop.',
  },
  props: {
    entry: 'dist/props/index.d.ts',
    demo:  'props',
    desc:  'Declarative prop definitions: seed-deterministic factories that build, place and dispose themed objects.',
  },
  lighting: {
    entry: 'dist/lighting/index.d.ts',
    demo:  'lighting',
    desc:  'Lighting rigs: IBL environment, shadow-tuned sun, hemisphere fill.',
    example: `const rig = setupStandardLighting(scene, renderer, { environment: true, sun: true })`,
  },
  particles: {
    entry: 'dist/particles/index.d.ts',
    demo:  'particles',
    desc:  'Deterministic particle systems: CPU emitter with shapes, rates, bursts and curves over lifetime, plus a GPGPU emitter for 50k+ particles; curve bakers for shader-side sampling.',
    example: `const emitter = createEmitter({
  shape: { type: 'cone', angle: 0.4 }, rate: 200,
  velocity: [0, 3, 0], lifetime: [0.8, 1.4],
  size: { curve: [[0, 0.1], [0.2, 0.35], [1, 0]] },
  seed: 7,
})
scene.add(emitter.points)
loop.onFrame(ctx => emitter.update(ctx))`,
  },
  post: {
    entry: 'dist/post/index.d.ts',
    demo:  'post-processing',
    desc:  'WebGL EffectComposer post-processing: reorderable named pipeline plus individual passes — colour grade, god rays, depth-of-field with chromatic aberration, film grain, CRT, glitch stack, lensing, HUD beams, stereo.',
    example: `const post = createPostPipeline(renderer, scene, camera, [
  ['bloom', { strength: 0.7 }],
  ['grade', { saturation: 1.1, lift: [0, 0, 0.02] }],
])
loop.onFrame(({ delta }) => post.render(delta))`,
  },
  'post/webgpu': {
    entry: 'dist/post/webgpu/index.d.ts',
    demo:  'effects',
    desc:  'WebGPU/TSL node-based effects mirroring the three.js WebGPU postprocessing examples: AO/GTAO, bloom (incl. selective + emissive), DOF, god rays, SSR, SSGI, SSS, TRAA, motion blur, outline, LUT, SMAA/FXAA/SSAA and more. Requires WebGPURenderer.',
    example: `import * as webgpuPost from '@tuomashatakka/threejs-scenes/post/webgpu'

const { color, viewZ } = webgpuPost.createScenePass(scene, camera)
const bloom  = webgpuPost.createBloom(color, { strength: 0.8 })
const graded = webgpuPost.createDof(color.add(bloom), viewZ, { bokehScale: 2 })
const post   = webgpuPost.createPostProcessing(renderer, graded)`,
  },
  'post/webgl': {
    entry: 'dist/post/webgl/index.d.ts',
    demo:  'effects',
    desc:  'ShaderPass ports of the WebGPU effect set for plain WebGLRenderer + EffectComposer chains.',
  },
  procedural: {
    entry: 'dist/procedural/index.d.ts',
    demo:  'procedural',
    desc:  'Deterministic procedural generation: seeded mulberry32 RNG with per-consumer forking, Poisson-disk sampling, seamless noise textures, 3D simplex noise with fbm/ridged sums, procedural planets.',
    example: `const rng = createSeededRng(42)
const planet = createProceduralBody({ seed: rng.int(1e9), radius: 2, type: 'terrestrial' })
scene.add(planet.object)`,
  },
  voxels: {
    entry: 'dist/voxels/index.d.ts',
    demo:  'voxels',
    desc:  'Chunked voxel storage, greedy meshing and a streaming chunk manager for infinite worlds.',
    example: `const chunk = new VoxelChunk(32)
chunk.fill((x, y, z) => noise.fbm(x / 16, y / 16, z / 16) > 0.1 ? 1 : 0)
scene.add(greedyMesh(chunk, material))`,
  },
  architecture: {
    entry: 'dist/architecture/index.d.ts',
    demo:  'architecture',
    desc:  'The context-injection module architecture from a shipping project: scene modules, LRU view registries, pooled materials, procedural texture caches, undo stacks, param resolution and distortion-aware picking.',
    example: `const module = createSceneModule({
  id: 'rocks',
  setup: ctx => { /* build once */ },
  update: (ctx, frame) => { /* per tick */ },
})`,
  },
  jsx: {
    entry: 'dist/jsx/index.d.ts',
    demo:  'jsx-scene',
    desc:  'Reactive JSX layer (no React): author scenes as elements, render() mounts them, signals re-apply reactive props every frame. Component hooks (useScene, useFrame, …) expose the library’s main interfaces inside function components; useFrameLoop works anywhere.',
    example: `import { render, h, useSignal, useFrame, useScene } from '@tuomashatakka/threejs-scenes/jsx'

const [hue, setHue] = useSignal(0.5)
function Spinner () {
  const scene = useScene()
  useFrame(({ delta }) => { /* per-frame */ })
  return h('mesh', { geometry: 'box', rotationY: hue })
}
render(h(Spinner, {}), { canvas })`,
  },
  types: {
    entry: 'dist/types.d.ts',
    desc:  'Shared contracts: SceneContext, SceneModule, FrameLoop/FrameContext, PropDefinition, AnimationController, QualityPreset, SeededRng.',
  },
}

interface DocExport {
  name:      string
  kind:      string
  doc:       string
  signature: string
}

const KIND: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.FunctionDeclaration]:  'function',
  [ts.SyntaxKind.ClassDeclaration]:     'class',
  [ts.SyntaxKind.InterfaceDeclaration]: 'interface',
  [ts.SyntaxKind.TypeAliasDeclaration]: 'type',
  [ts.SyntaxKind.VariableDeclaration]:  'const',
  [ts.SyntaxKind.EnumDeclaration]:      'enum',
}

function clean (text: string): string {
  return text
    .replace(/^export\s+/gm, '')
    .replace(/^declare\s+/gm, '')
    .replace(/\bexport\s+declare\s+/g, '')
    .trim()
}

function extract (): Record<string, DocExport[]> {
  const entries = Object.values(MODULES).map(m => root + m.entry)
  const program = ts.createProgram(entries, { target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler })
  const checker = program.getTypeChecker()
  const out: Record<string, DocExport[]> = {}

  for (const [ name, meta ] of Object.entries(MODULES)) {
    const sf = program.getSourceFile(root + meta.entry)
    if (!sf) {
      console.warn(`docs: missing ${meta.entry}`)
      continue
    }
    const moduleSymbol = checker.getSymbolAtLocation(sf)
    if (!moduleSymbol)
      continue
    const exports: DocExport[] = []
    for (const sym of checker.getExportsOfModule(moduleSymbol)) {
      const resolved = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym
      const decls = (resolved.declarations ?? []).filter(d => KIND[d.kind])
      if (!decls.length)
        continue
      const doc = ts.displayPartsToString(resolved.getDocumentationComment(checker))
        || ts.displayPartsToString(sym.getDocumentationComment(checker))
      exports.push({
        name:      sym.getName(),
        kind:      KIND[decls[0].kind] ?? 'value',
        doc:       doc.trim(),
        signature: decls.map(d => clean(d.kind === ts.SyntaxKind.VariableDeclaration ? d.parent.parent.getText() : d.getText())).join('\n'),
      })
    }
    // stable, declaration-agnostic ordering: functions/classes first, then consts, then types
    const rank = (k: string): number => k === 'function' || k === 'class' ? 0 : k === 'const' || k === 'enum' ? 1 : 2
    exports.sort((a, b) => rank(a.kind) - rank(b.kind))
    out[name] = exports
  }
  return out
}

function summary (doc: string): string {
  const first = doc.split(/\.\s|\n/)[0].trim()
  return first ? first.replace(/\.?$/, '.') : ''
}

function escapeHtml (s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function slugify (name: string): string {
  return 'api-' + name.replace(/\//g, '-')
}

// ---------------------------------------------------------------- readme.md

function renderReadme (api: Record<string, DocExport[]>): string {
  const lines: string[] = []
  lines.push('Generated from the built `.d.ts` files by `bun run docs` — full declarations, doc comments,')
  lines.push('runnable examples and live previews on the [API reference page](https://tuomashatakka.github.io/threejs-scenes-skill/api.html).')
  lines.push('')
  for (const [ mod, exports ] of Object.entries(api)) {
    const meta = MODULES[mod]
    lines.push(`#### \`${mod === 'types' ? '@tuomashatakka/threejs-scenes/types' : '@tuomashatakka/threejs-scenes/' + mod}\``)
    lines.push('')
    lines.push(meta.desc)
    if (meta.demo)
      lines.push(`Live demo: [\`${meta.demo}.html\`](https://tuomashatakka.github.io/threejs-scenes-skill/demos/${meta.demo}.html)`)
    lines.push('')
    for (const e of exports) {
      const head = `- **\`${e.name}\`** *(${e.kind})*${e.doc ? ' — ' + summary(e.doc) : ''}`
      lines.push(head)
      if (e.kind === 'function') {
        const sig = e.signature.split('\n').filter(l => l.startsWith('function')).join('\n') || e.signature
        lines.push('')
        lines.push('  ```ts')
        for (const l of sig.split('\n'))
          lines.push('  ' + l)
        lines.push('  ```')
      }
    }
    if (meta.example) {
      lines.push('')
      lines.push('  <details><summary>Example</summary>')
      lines.push('')
      lines.push('  ```ts')
      for (const l of meta.example.split('\n'))
        lines.push('  ' + l)
      lines.push('  ```')
      lines.push('  </details>')
    }
    lines.push('')
  }
  return lines.join('\n')
}

// -------------------------------------------------------------- public/api.html

function renderApiHtml (api: Record<string, DocExport[]>): string {
  const version = JSON.parse(readFileSync(root + 'package.json', 'utf8')).version as string
  const nav = Object.keys(api).map(m => `        <li><a href="#${slugify(m)}">${m}</a></li>`).join('\n')

  const sections = Object.entries(api).map(([ mod, exports ]) => {
    const meta = MODULES[mod]
    const id = slugify(mod)
    const demo = meta.demo
      ? `      <div class="api-preview"><iframe loading="lazy" title="${mod} live demo" src="demos/${meta.demo}.html"></iframe></div>
      <p class="demo-link"><a href="demos/${meta.demo}.html">Open demo — ${meta.demo}.html</a></p>`
      : ''
    const example = meta.example
      ? `      <pre class="api-example"><code>${escapeHtml(meta.example)}</code></pre>`
      : ''
    const cards = exports.map(e => `      <article class="api-card" id="${id}-${e.name.toLowerCase()}">
        <h4><code>${e.name}</code> <span class="badge">${e.kind}</span></h4>
        ${e.doc ? `<p>${escapeHtml(e.doc)}</p>` : ''}
        <pre><code>${escapeHtml(e.signature)}</code></pre>
      </article>`).join('\n')
    return `    <section id="${id}" aria-labelledby="${id}-h">
      <h2 id="${id}-h"><code>@tuomashatakka/threejs-scenes/${mod}</code></h2>
      <p>${escapeHtml(meta.desc)}</p>
${example}
${demo}
${cards}
    </section>`
  }).join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API reference — threejs-scenes</title>
  <meta name="description" content="Complete generated API reference for @tuomashatakka/threejs-scenes v${version}: every export, its exact declaration and doc comment, with runnable examples and live previews.">
  <link rel="stylesheet" href="styles.css">
  <style>
    .api-card { border: 1px solid #2a3346; border-radius: 12px; padding: .2rem 1rem .6rem; margin: .8rem 0; background: #10141f; }
    .api-card h4 { margin: .6rem 0 .2rem; }
    .api-card pre { margin: .4rem 0 .2rem; max-height: 26em; overflow: auto; }
    .api-preview { width: 100%; aspect-ratio: 16 / 9; border: 1px solid #2a3346; border-radius: 12px; background: #0a0a14; overflow: hidden; margin: .8rem 0 .4rem; }
    .api-preview iframe { width: 100%; height: 100%; border: 0; display: block; }
    .api-example { border-left: 3px solid #79f7ff; }
  </style>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header>
    <h1>API reference</h1>
    <p><code>@tuomashatakka/threejs-scenes</code> v${version} — every export with its exact declaration, generated from the package's <code>.d.ts</code> files. See the <a href="index.html">showcase</a> for the guided tour.</p>
  </header>
  <main id="main">
    <nav aria-label="Module table of contents">
      <ul>
${nav}
      </ul>
    </nav>
${sections}
  </main>
</body>
</html>
`
}

// ------------------------------------------------------------------- write

const api = extract()

const readmePath = root + 'readme.md'
let readme = readFileSync(readmePath, 'utf8')
const BEGIN = '<!-- api:begin -->'
const END   = '<!-- api:end -->'
if (!readme.includes(BEGIN))
  throw new Error('readme.md is missing the <!-- api:begin --> / <!-- api:end --> markers')
readme = readme.slice(0, readme.indexOf(BEGIN) + BEGIN.length)
  + '\n' + renderReadme(api) + '\n'
  + readme.slice(readme.indexOf(END))
writeFileSync(readmePath, readme)

writeFileSync(root + 'public/api.html', renderApiHtml(api))

const counts = Object.entries(api).map(([ m, e ]) => `${m}:${e.length}`).join(' ')
console.log(`docs: readme.md + public/api.html regenerated (${counts})`)
