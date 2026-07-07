// scripts/generate-docs.ts
// Generates readme API docs plus vite-consumed site data from the built dist/
// declaration files, skill references, and skill script index.

import ts from 'typescript'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename } from 'node:path'
import { fileURLToPath } from 'node:url'


const root = fileURLToPath(new URL('..', import.meta.url))
const siteGenerated = `${root}site/src/generated`

interface PackageJson {
  name:    string
  version: string
  exports: Record<string, { types: string, import: string }>
}

interface ModuleMeta {
  id:        string
  subpath:   string
  specifier: string
  title:     string
  desc:      string
  entry:     string
  importUrl: string
  example?:  string
}

interface DocExport {
  name:         string
  kind:         string
  doc:          string
  summary:      string
  signature:    string
  coverage:     'playground' | 'type-reference'
  sample:       string
  relatedDemos: string[]
  playSeed?:    PlaySeed
}

interface LibraryData {
  version:     string
  packageName: string
  generatedAt: string
  totals: {
    exports: number
    modules: number
    playable: number
    typeReferences: number
  }
  modules: Array<ModuleMeta & { exports: DocExport[] }>
}

interface ParsedParam {
  raw:                 string
  name:                string
  type:                string
  optional:            boolean
  rest:                boolean
  destructuredFields?: DestructuredField[]
}

interface DestructuredField {
  name:      string
  localName: string
}

interface ParsedSignature {
  name:       string
  params:     ParsedParam[]
  returnType: string
  isClass:    boolean
}

type HarnessFlavor = 'standard' | 'post' | 'jsx' | 'webgpu'
type WiringKind = 'object3d' | 'material' | 'camera' | 'pass' | 'value'

interface PlaySeed {
  moduleId:       string
  exportName:     string
  flavor:         HarnessFlavor
  kind:           WiringKind
  code:           string
  requiresWebGpu: boolean
}

interface SkillScript {
  file:      string
  category:  string
  purpose:   string
  reference: string
  exists:    boolean
}

interface SkillReference {
  file:    string
  title:   string
  summary: string
}

interface SkillCase {
  id:        string
  title:     string
  summary:   string
  demoMode:  'live' | 'schema' | 'guide'
  tags:      string[]
  demos:     string[]
  refs:      string[]
  scripts:   string[]
  checklist: string[]
}

interface SkillData {
  version:    string
  generatedAt: string
  skill: {
    name:        string
    description: string
  }
  references: SkillReference[]
  scripts:    SkillScript[]
  cases:      SkillCase[]
  coverage: {
    references: { total: number, covered: number }
    scripts:    { total: number, covered: number }
  }
}

const KIND: Partial<Record<ts.SyntaxKind, string>> = {
  [ts.SyntaxKind.FunctionDeclaration]:  'function',
  [ts.SyntaxKind.ClassDeclaration]:     'class',
  [ts.SyntaxKind.InterfaceDeclaration]: 'interface',
  [ts.SyntaxKind.TypeAliasDeclaration]: 'type',
  [ts.SyntaxKind.VariableDeclaration]:  'const',
  [ts.SyntaxKind.EnumDeclaration]:      'enum',
}

const DESCRIPTIONS: Record<string, { title: string, desc: string, example?: string }> = {
  '.': {
    title:   'core library',
    desc:    'The unified WebGL API: app scaffolding, renderer loops, cameras, materials, geometry, instancing, loaders, animation, props, lighting, particles, post-processing, voxels, procedural helpers, state, and architecture utilities.',
    example: `import { createApp, createIsoScaffold, createToonMaterial } from '@tuomashatakka/threejs-scenes'`,
  },
  './webgpu': {
    title:   'webgpu effects',
    desc:    'Experimental WebGPU/TSL node post-processing helpers isolated from the WebGL barrel so standard scenes never need to resolve three/webgpu.',
    example: `import * as webgpuPost from '@tuomashatakka/threejs-scenes/webgpu'`,
  },
  './jsx': {
    title:   'jsx scene layer',
    desc:    'Reactive JSX-style scene authoring without React: render() mounts real three.js objects and function props are re-read on the frame loop.',
    example: `import { render, h, signal } from '@tuomashatakka/threejs-scenes/jsx'`,
  },
  './jsx/jsx-runtime': {
    title:   'jsx runtime',
    desc:    'The jsx/jsxs/Fragment runtime target for tsconfig jsxImportSource plus the hyperscript helper used by no-build demos.',
    example: `import { jsx, jsxs, Fragment } from '@tuomashatakka/threejs-scenes/jsx/jsx-runtime'`,
  },
}

const DEMO_CATALOG = [
  { slug: 'bootstrap', label: 'Bootstrap', caption: 'createApp state flow, fixed-step clock, seeded emitter, and click-to-reseed interaction.' },
  { slug: 'minimal-scene', label: 'Minimal', caption: 'Renderer, frame loop, pointer orbit, resize observer, and explicit disposal.' },
  { slug: 'geometry', label: 'Geometry', caption: 'Extruded shapes, lathe surfaces, deformers, static merging, and layout helpers.' },
  { slug: 'materials', label: 'Materials', caption: 'PBR presets, toon ramps, matcap material, and material comparisons.' },
  { slug: 'props', label: 'Props', caption: 'Reusable prop factories, composites, animation clips, and instanced props.' },
  { slug: 'animation', label: 'Animation', caption: 'Programmatic clips and createAnimationController crossfades.' },
  { slug: 'jsx-scene', label: 'JSX layer', caption: 'Hyperscript tree rendered by the reactive scene layer.' },
  { slug: 'instanced-field', label: 'Instancing', caption: 'One-geometry InstancedMesh field with seeded placement.' },
  { slug: 'batched-buildings', label: 'Batched', caption: 'Varied geometries sharing one material through BatchedMesh.' },
  { slug: 'procedural', label: 'Procedural', caption: 'Seeded forest scatter with Poisson disk sampling and noise terrain.' },
  { slug: 'shader-material', label: 'Shader', caption: 'Holographic ShaderMaterial with fresnel, scanlines, and animated opacity.' },
  { slug: 'lighting', label: 'Lighting', caption: 'Environment, sun, and hemisphere fill toggles.' },
  { slug: 'particles', label: 'Particles', caption: 'Emitter shapes, lifetime curves, bursts, and gpu-emitter fallback.' },
  { slug: 'isometric', label: 'Isometric', caption: 'Orthographic isometric camera and instanced props.' },
  { slug: 'isometric-infinite', label: 'Infinite iso', caption: 'Endless heightmap terrain under an isometric camera.' },
  { slug: 'follow-camera', label: 'Follow cam', caption: 'Framerate-independent third-person camera damping.' },
  { slug: 'post-processing', label: 'Post FX', caption: 'Composer chain with bloom, grade, and depth-sampling passes.' },
  { slug: 'glitch', label: 'Glitch', caption: 'RGB shift, block displacement, and scan corruption passes.' },
  { slug: 'god-rays', label: 'God rays', caption: 'Screen-space light shafts from a projected light position.' },
  { slug: 'dof', label: 'DOF + CA', caption: 'Depth of field with chromatic aberration from a depth texture.' },
  { slug: 'effects', label: 'Effects FX', caption: 'Interactive WebGL composer and WebGPU/TSL effect playground.' },
  { slug: 'voxels', label: 'Voxels', caption: 'VoxelChunk storage and greedy meshing terrain.' },
  { slug: 'architecture', label: 'Architecture', caption: 'Scene modules, material pools, pick introspection, and cleanup ownership.' },
  { slug: 'icaras-foundry', label: 'Icaras Foundry', caption: 'A complete stylized ship-forge scene with bloom, beams, particles, and blueprint mode.' },
] as const

const SKILL_CASES: SkillCase[] = [
  {
    id: 'foundation',
    title: 'minimal production scene',
    summary: 'start with renderer, one loop, resize observer, pointer gestures, quality tiers, and explicit cleanup.',
    demoMode: 'live',
    tags: [ 'core', 'renderer', 'lifecycle' ],
    demos: [ 'minimal-scene', 'bootstrap' ],
    refs: [ 'core-principles.md', 'project-architecture.md', 'fundamentals.md', 'library-local.md', 'production-lessons.md', 'code-style.md', 'anti-patterns.md' ],
    scripts: [ 'frame-loop.js', 'renderer-setup.js', 'scene-bootstrap.js', 'pointer-gesture.js', 'dispose-scene.js', 'quality-tier.js' ],
    checklist: [ 'single loop', 'pixel ratio <= 2', 'resize observer on parent', 'dispose all owned resources' ],
  },
  {
    id: 'camera-touch',
    title: 'camera and touch controls',
    summary: 'orbit, iso, follow, path, pointer capture, pinch zoom, and raycast-safe pointer coordinates.',
    demoMode: 'live',
    tags: [ 'camera', 'input', 'mobile' ],
    demos: [ 'isometric', 'follow-camera' ],
    refs: [ 'camera-handling.md', 'isometric-and-infinite-scenes.md' ],
    scripts: [ 'iso-camera.js', 'follow-camera.js', 'pointer-gesture.js' ],
    checklist: [ 'pointer events only', 'setPointerCapture on down', 'wheel listener passive false', 'damped movement' ],
  },
  {
    id: 'instancing-infinite',
    title: 'instancing, billboards, and infinite scenes',
    summary: 'choose InstancedMesh, BatchedMesh, billboards, chunk managers, and origin rebasing for large worlds.',
    demoMode: 'live',
    tags: [ 'instancing', 'billboards', 'infinite' ],
    demos: [ 'instanced-field', 'batched-buildings', 'isometric-infinite' ],
    refs: [ 'instancing.md', 'billboards.md', 'isometric-and-infinite-scenes.md', 'performance.md' ],
    scripts: [ 'instancing-grass.js', 'batched-buildings.js', 'sprite-batch.js', 'chunk-manager.js', 'iso-camera.js' ],
    checklist: [ 'one geometry repeated -> InstancedMesh', 'varied geometry same material -> BatchedMesh', 'rebase open worlds' ],
  },
  {
    id: 'geometry-procedural',
    title: 'geometry and procedural generation',
    summary: 'build shapes, extrusions, tubes, lattices, seeded scatter, noise textures, and runtime geometry factories.',
    demoMode: 'live',
    tags: [ 'geometry', 'procedural', 'textures' ],
    demos: [ 'geometry', 'procedural' ],
    refs: [ 'geometry.md', 'programmatic-generation.md', 'textures-and-maps.md' ],
    scripts: [ 'procedural-crystal-geometry.js', 'extruded-mesh.js', 'geometry-modifiers.js', 'poisson-disk.js', 'rng.js', 'noise-texture.js', 'glyph-atlas.js' ],
    checklist: [ 'seeded factories over static arrays', 'compute bounds after deformation', 'reuse scratch vectors' ],
  },
  {
    id: 'materials-shaders',
    title: 'materials and shaders',
    summary: 'combine pbr presets, toon ramps, matcaps, triplanar mapping, and shader-material recipes without raw string chaos.',
    demoMode: 'live',
    tags: [ 'materials', 'shader', 'glsl' ],
    demos: [ 'materials', 'shader-material' ],
    refs: [ 'materials.md', 'shaders.md', 'textures-and-maps.md' ],
    scripts: [ 'material-presets.js', 'holographic-material.js', 'noise-texture.js' ],
    checklist: [ 'wrap glsl in tagged templates', 'share materials', 'dispose generated textures' ],
  },
  {
    id: 'lighting',
    title: 'lighting setup',
    summary: 'compose image-based environment, shadow-tuned sun, hemisphere fill, and visible light cones.',
    demoMode: 'live',
    tags: [ 'lighting', 'shadows', 'environment' ],
    demos: [ 'lighting' ],
    refs: [ 'lighting.md' ],
    scripts: [ 'lighting-setup.js' ],
    checklist: [ 'hemisphere fill before ambient-only lighting', 'tight shadow frustum', 'mobile shadow budget' ],
  },
  {
    id: 'particles',
    title: 'particles and billboards',
    summary: 'use cpu instanced particles, gpu-emitter paths, baked curves, and camera-facing sprite batches.',
    demoMode: 'live',
    tags: [ 'particles', 'billboards', 'curves' ],
    demos: [ 'particles' ],
    refs: [ 'particles.md', 'billboards.md', 'performance.md' ],
    scripts: [ 'cpu-particles.js', 'sprite-batch.js', 'rng.js' ],
    checklist: [ 'no Sprite per particle', 'depthWrite false for transparent particles', 'curves baked to buffers/textures' ],
  },
  {
    id: 'post-processing',
    title: 'post-processing effects',
    summary: 'wire composer chains, bloom, glitch, god rays, dof, film grain, hud beam transitions, and stereoscopy.',
    demoMode: 'live',
    tags: [ 'post', 'composer', 'effects' ],
    demos: [ 'effects', 'post-processing', 'glitch', 'god-rays', 'dof' ],
    refs: [ 'post-processing.md', 'cinematic-and-streaming.md', 'shaders.md' ],
    scripts: [ 'composer-setup.js', 'glitch-passes.js', 'god-rays-pass.js', 'dof-chromatic-pass.js', 'film-grain-pass.js', 'hud-beam-transition.js', 'stereoscopy.js' ],
    checklist: [ 'output pass last', 'depth texture for depth effects', 'disable expensive passes on touch devices' ],
  },
  {
    id: 'voxels',
    title: 'voxel worlds',
    summary: 'store voxel chunks compactly, greedy-mesh exposed faces, and update only affected chunks.',
    demoMode: 'live',
    tags: [ 'voxels', 'terrain', 'meshing' ],
    demos: [ 'voxels' ],
    refs: [ 'voxel-geometry.md', 'performance.md' ],
    scripts: [ 'voxel-data.js', 'greedy-mesh.js', 'chunk-manager.js' ],
    checklist: [ 'never mesh per voxel', 'greedy merge same-id faces', 'remesh affected chunk boundaries' ],
  },
  {
    id: 'props-animation-jsx',
    title: 'props, animation, and jsx',
    summary: 'compose props, load gltf fallbacks, author programmatic clips, and mount reactive jsx scenes without react.',
    demoMode: 'live',
    tags: [ 'props', 'animation', 'jsx' ],
    demos: [ 'props', 'animation', 'jsx-scene' ],
    refs: [ 'props-and-factories.md', 'animation-system.md', 'jsx-layer.md' ],
    scripts: [ 'prop-factory.js', 'prop-composite.js', 'animation-controller.js', 'gltf-prop.js', 'jsx-scene.js' ],
    checklist: [ 'prop owns its dispose path', 'mixer uncacheRoot on teardown', 'function props are reactive accessors' ],
  },
  {
    id: 'performance-debug',
    title: 'performance and debug workflow',
    summary: 'diagnose draw calls, fragments, gc pressure, shader stalls, and scene ownership before optimizing.',
    demoMode: 'guide',
    tags: [ 'performance', 'debug', 'cleanup' ],
    demos: [ 'architecture', 'minimal-scene' ],
    refs: [ 'performance.md', 'anti-patterns.md', 'production-lessons.md' ],
    scripts: [ 'dispose-scene.js', 'quality-tier.js', 'frame-loop.js' ],
    checklist: [ 'renderer.info before guessing', 'compile before first frame', 'avoid per-frame allocations' ],
  },
  {
    id: 'llm-codegen',
    title: 'llm-driven scene generation',
    summary: 'route prompts through structured function tools, zod validation, deterministic seeds, and auditable generated files.',
    demoMode: 'schema',
    tags: [ 'llm', 'codegen', 'schemas' ],
    demos: [],
    refs: [ 'prompt-handling-flow.md', 'llm-function-definitions.md', 'threejs-docs-lookup.md' ],
    scripts: [ 'llm-functions.js', 'codegen-runner.js', 'query-threejs-docs.js' ],
    checklist: [ 'schemas before free-form code', 'embed prompt/model/seed metadata', 'cap tool roundtrips' ],
  },
]

const packageJson = JSON.parse(readFileSync(`${root}package.json`, 'utf8')) as PackageJson
const generatedAt = `package ${packageJson.version}`

function moduleId (subpath: string): string {
  return subpath === '.' ? 'root' : subpath.slice(2).replace(/\//g, '-')
}

function publicImportUrl (importPath: string): string {
  return '/lib/' + importPath.replace(/^\.\//, '')
}

function moduleSpecifier (subpath: string): string {
  return subpath === '.' ? packageJson.name : packageJson.name + subpath.slice(1)
}

function modulesFromPackage (): ModuleMeta[] {
  return Object.entries(packageJson.exports).map(([ subpath, config ]) => {
    const meta = DESCRIPTIONS[subpath] ?? {
      title: subpath,
      desc:  `Generated documentation for ${moduleSpecifier(subpath)}.`,
    }
    return {
      id:        moduleId(subpath),
      subpath,
      specifier: moduleSpecifier(subpath),
      title:     meta.title,
      desc:      meta.desc,
      entry:     config.types.replace(/^\.\//, ''),
      importUrl: publicImportUrl(config.import),
      example:   meta.example,
    }
  })
}

function clean (text: string): string {
  return text
    .replace(/^export\s+/gm, '')
    .replace(/^declare\s+/gm, '')
    .replace(/\bexport\s+declare\s+/g, '')
    .trim()
}

function summary (doc: string): string {
  const first = doc.split(/\.\s|\n/)[0].trim()
  return first ? first.replace(/\.?$/, '.') : ''
}

function findMatching (text: string, openIndex: number, openChar = '(', closeChar = ')'): number {
  let depth = 0
  let quote = ''
  for (let i = openIndex; i < text.length; i += 1) {
    const ch   = text[i]
    const prev = text[i - 1]
    if (quote) {
      if (ch === quote && prev !== '\\')
        quote = ''
      continue
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === openChar)
      depth += 1
    else if (ch === closeChar) {
      depth -= 1
      if (depth === 0)
        return i
    }
  }
  return -1
}

function splitTopLevel (text: string, separator = ','): string[] {
  const out: string[] = []
  let start   = 0
  let paren   = 0
  let brace   = 0
  let bracket = 0
  let angle   = 0
  let quote   = ''

  for (let i = 0; i < text.length; i += 1) {
    const ch   = text[i]
    const prev = text[i - 1]
    if (quote) {
      if (ch === quote && prev !== '\\')
        quote = ''
      continue
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '(')
      paren += 1
    else if (ch === ')')
      paren -= 1
    else if (ch === '{')
      brace += 1
    else if (ch === '}')
      brace -= 1
    else if (ch === '[')
      bracket += 1
    else if (ch === ']')
      bracket -= 1
    else if (ch === '<')
      angle += 1
    else if (ch === '>')
      angle = Math.max(0, angle - 1)
    else if (ch === separator && paren === 0 && brace === 0 && bracket === 0 && angle === 0) {
      const item = text.slice(start, i).trim()
      if (item)
        out.push(item)
      start = i + 1
    }
  }

  const tail = text.slice(start).trim()
  if (tail)
    out.push(tail)
  return out
}

function findTopLevelColon (text: string): number {
  let paren   = 0
  let brace   = 0
  let bracket = 0
  let angle   = 0
  let quote   = ''

  for (let i = 0; i < text.length; i += 1) {
    const ch   = text[i]
    const prev = text[i - 1]
    if (quote) {
      if (ch === quote && prev !== '\\')
        quote = ''
      continue
    }
    if (ch === '"' || ch === '\'' || ch === '`') {
      quote = ch
      continue
    }
    if (ch === '(')
      paren += 1
    else if (ch === ')')
      paren -= 1
    else if (ch === '{')
      brace += 1
    else if (ch === '}')
      brace -= 1
    else if (ch === '[')
      bracket += 1
    else if (ch === ']')
      bracket -= 1
    else if (ch === '<')
      angle += 1
    else if (ch === '>')
      angle = Math.max(0, angle - 1)
    else if (ch === ':' && paren === 0 && brace === 0 && bracket === 0 && angle === 0)
      return i
  }

  return -1
}

function parseDestructuredFields (nameText: string): DestructuredField[] {
  const open  = nameText.indexOf('{')
  const close = findMatching(nameText, open, '{', '}')
  if (open < 0 || close < 0)
    return []
  return splitTopLevel(nameText.slice(open + 1, close))
    .map((field): DestructuredField | null => {
      const raw = field.replace(/\?$/, '').trim()
      if (!raw || raw.startsWith('...'))
        return null

      const [ name, localName = name ] = raw.split(':').map(part => part.trim())
      if (!name || name.includes(' '))
        return null
      return { name, localName }
    })
    .filter((field): field is DestructuredField => Boolean(field))
}

function parseParam (raw: string): ParsedParam | null {
  const text = raw.trim()
  if (!text)
    return null

  const colon    = findTopLevelColon(text)
  const nameText = colon >= 0 ? text.slice(0, colon).trim() : text
  const type     = colon >= 0 ? text.slice(colon + 1).trim() : 'unknown'
  const rest     = nameText.startsWith('...')
  const bareName = nameText.replace(/^\.\.\./, '').replace(/\?$/, '')
    .trim()
  const optional           = rest || (/\?\s*$/).test(nameText)
  const destructuredFields = bareName.startsWith('{') ? parseDestructuredFields(bareName) : undefined
  const name               = destructuredFields ? 'options' : bareName

  return { raw: text, name, type, optional, rest, destructuredFields }
}

function parseSignature (entry: DocExport): ParsedSignature | null {
  if (entry.kind === 'function') {
    const match = entry.signature.match(new RegExp(`function\\s+${entry.name}(?:<[^>]+>)?\\s*\\(`))
    if (!match || match.index === undefined)
      return null

    const open  = entry.signature.indexOf('(', match.index)
    const close = findMatching(entry.signature, open)
    if (open < 0 || close < 0)
      return null

    const params = splitTopLevel(entry.signature.slice(open + 1, close))
      .map(parseParam)
      .filter((param): param is ParsedParam => Boolean(param))
    const after      = entry.signature.slice(close + 1)
    const colon      = after.indexOf(':')
    const returnType = colon >= 0
      ? after.slice(colon + 1).trim()
        .replace(/;$/, '')
      : 'void'
    return { name: entry.name, params, returnType, isClass: false }
  }

  if (entry.kind === 'class') {
    const constructorIndex = entry.signature.indexOf('constructor(')
    if (constructorIndex < 0)
      return { name: entry.name, params: [], returnType: entry.name, isClass: true }

    const open   = entry.signature.indexOf('(', constructorIndex)
    const close  = findMatching(entry.signature, open)
    const params = open >= 0 && close >= 0
      ? splitTopLevel(entry.signature.slice(open + 1, close)).map(parseParam)
        .filter((param): param is ParsedParam => Boolean(param))
      : []
    return { name: entry.name, params, returnType: entry.name, isClass: true }
  }

  return null
}

function unwrapReturnType (type: string): string {
  const promise = type.match(/^Promise<(.+)>$/s)
  return promise ? promise[1]!.trim() : type
}

function classifyReturn (entry: DocExport, parsed: ParsedSignature): WiringKind {
  const type = unwrapReturnType(parsed.isClass ? entry.name : parsed.returnType)
  if ((/\b(Pass|ShaderPass|ComposerHandle|PostPipeline|StereoRenderer|SelectiveBloomHandle|HudBeamTransition|BurnInPass|CrtPass|RetroPass|MotionBlurPass|DifferencePass|AnamorphicPass)\b/).test(type))
    return 'pass'
  if ((/\b(Camera|PerspectiveCamera|OrthographicCamera)\b/).test(type))
    return 'camera'
  if ((/Material\b|TickableMaterial\b/).test(type))
    return 'material'
  if ((/\b(Object3D|Mesh|Group|LineSegments|Points|Light|InstancedMesh|BatchedMesh|BufferGeometry|Shape|ProceduralBody|InfiniteGround|ConnectionGraph|PropInstance|PropComposite|InstancedPropResult|ChunkManager|SkyboxHandle)\b/).test(type))
    return 'object3d'
  return 'value'
}

function flavorFor (module: ModuleMeta, entry: DocExport, kind: WiringKind): HarnessFlavor {
  if (module.id === 'webgpu')
    return 'webgpu'
  if (module.id === 'jsx' || module.id === 'jsx-jsx-runtime')
    return 'jsx'
  if (kind === 'pass' || (/Pass|Composer|Pipeline|Bloom|Dof|Rays|Glitch|Crt|Lensing|BurnIn|FilmGrain|HudBeam|Stereo/i).test(entry.name))
    return 'post'
  return 'standard'
}

function nameAwareNumber (name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('seed'))
    return '7'
  if (lower.includes('count') || lower.includes('capacity'))
    return '32'
  if (lower.includes('resolution') || lower.includes('segments'))
    return '32'
  if (lower.includes('sides') || lower.includes('teeth') || lower.includes('points'))
    return '6'
  if (lower.includes('duration'))
    return '2'
  if (lower === 't' || lower.includes('progress') || lower.includes('mix'))
    return '0.5'
  if (lower.includes('angle'))
    return 'Math.PI / 4'
  if (lower.includes('aspect'))
    return 'canvas.clientWidth / Math.max(1, canvas.clientHeight)'
  if (lower.includes('width'))
    return '1.8'
  if (lower.includes('height'))
    return '1.2'
  if (lower.includes('inner'))
    return '0.45'
  if (lower.includes('outer'))
    return '1'
  if (lower.includes('radius') || lower.includes('size'))
    return '1'
  if (lower.includes('distance'))
    return '4'
  if (lower.includes('near'))
    return '0.1'
  if (lower.includes('far'))
    return '100'
  if (lower === 'x' || lower === 'y' || lower === 'z' || lower.startsWith('ndc'))
    return '0'
  if (lower.includes('min'))
    return '0.4'
  if (lower.includes('max'))
    return '1.4'
  return '1'
}

function stringLiteralFromUnion (type: string): string | null {
  const match = type.match(/'([^']+)'/)
  return match ? `'${match[1]}'` : null
}

function objectLiteralFromFieldValue (field: DestructuredField): string | null {
  const name       = field.name
  const local      = field.localName
  const lower      = name.toLowerCase()
  const localLower = local.toLowerCase()

  if (localLower.endsWith('options'))
    return '{}'
  if ([ 'scene', 'camera', 'renderer', 'canvas', 'loop' ].includes(name))
    return name
  if (lower === 'geometry')
    return 'demoGeometry.clone()'
  if (lower === 'geometries')
    return '[demoGeometry.clone(), new THREE.ConeGeometry(0.6, 1.2, 6)]'
  if (lower === 'material')
    return 'demoMaterial.clone()'
  if (lower === 'shape')
    return 'demoShape'
  if (lower === 'points' || lower === 'nodes')
    return 'demoPoints'
  if (lower === 'profile')
    return 'demoProfile'
  if (lower === 'path')
    return 'demoCurve'
  if (lower === 'transforms')
    return '[new THREE.Matrix4(), new THREE.Matrix4().makeTranslation(1.6, 0, 0)]'
  if (lower === 'build')
    return '(cx, cz, chunk) => { chunk.add(new THREE.Mesh(demoGeometry.clone(), demoMaterial.clone())) }'
  if (lower === 'create')
    return '() => ({ dispose () {} })'
  if (lower === 'paint')
    return 'paintDemoTexture'
  if (lower === 'onframe' || lower === 'onresize' || lower === 'oncomplete' || lower === 'callback' || lower === 'cb')
    return '() => {}'
  if (lower === 'state')
    return '{ hue: 0.55 }'
  if (lower === 'modules')
    return '[]'
  if (lower === 'clock' || lower === 'reducer' || lower === 'place')
    return null
  if (lower === 'background')
    return '\'#10131a\''
  if (lower.includes('color') || lower.includes('tint'))
    return '\'#6fe7d2\''
  if (lower === 'palette')
    return '[\'#10131a\', \'#6fe7d2\', \'#ff7ab6\', \'#ffd166\']'
  if (lower === 'position' || lower === 'offset' || lower === 'lookat' || lower === 'gravity' || lower === 'velocity')
    return '[0, 1, 0]'
  if (lower === 'lifetime')
    return '[0.8, 1.4]'
  if (lower === 'bounds')
    return 'new THREE.Box3(new THREE.Vector3(-1, -1, -1), new THREE.Vector3(1, 1, 1))'
  if (lower === 'texture')
    return 'null'
  if (lower === 'fragmentshader')
    return 'demoFragmentShader'
  if (lower === 'uniforms')
    return '{}'
  if (lower === 'pointerelement' || lower === 'element')
    return 'canvas'
  if (lower === 'type')
    return '\'terrestrial\''
  if (lower === 'name' || lower === 'key')
    return '\'demo\''
  if (lower === 'src' || lower === 'url')
    return '\'./replace-with-your-model.glb\''
  if (lower.includes('shadow') || lower.includes('enabled') || lower.includes('antialias') || lower.includes('orbit') || lower.includes('lighting'))
    return 'true'
  if (lower.includes('seed'))
    return '7'
  if (lower.includes('count') || lower.includes('capacity'))
    return '32'
  if (lower.includes('radius') || lower.includes('size') || lower.includes('scale'))
    return '1'
  if (lower.includes('duration'))
    return '2'
  if (lower.includes('angle'))
    return 'Math.PI / 4'
  if (lower.includes('frequency'))
    return '1.4'
  if (lower.includes('octaves'))
    return '3'
  if (lower.includes('intensity') || lower.includes('strength') || lower.includes('opacity'))
    return '0.8'
  if (lower.includes('near'))
    return '0.1'
  if (lower.includes('far'))
    return '100'
  return null
}

function synthesizeDestructuredParam (param: ParsedParam): string {
  const props = (param.destructuredFields ?? [])
    .map(field => {
      const value = objectLiteralFromFieldValue(field)
      return value ? `  ${field.name}: ${value}` : ''
    })
    .filter(Boolean)
  return props.length ? `{\n${props.join(',\n')}\n}` : '{}'
}

function synthesizeObjectByType (type: string, name: string): string {
  if ((/ExtrudeOptions\b/).test(type))
    return '{ shape: demoShape, depth: 0.35, material: demoMaterial.clone() }'
  if ((/TrackSpec\b/).test(type))
    return '{ path: \'.rotation[y]\', times: [0, 1, 2], values: [0, Math.PI, Math.PI * 2], type: \'number\' }'
  if ((/PropDefinition\b/).test(type))
    return '{ name: \'demo-prop\', build: () => ({ object: demoMesh.clone(), dispose () {} }) }'
  if ((/PropContext\b/).test(type))
    return '{ scene, renderer, camera, loop, rng: Math.random }'
  if ((/InstancedPropOptions\b/).test(type))
    return '{ count: 12, radius: 2, seed: 7 }'
  if ((/SceneModuleDefinition\b/).test(type))
    return '{ name: \'demo\', build: () => {}, dispose: () => {} }'
  if ((/ParamSpecMap\b/).test(type))
    return '{ speed: { kind: \'number\', default: 1 } }'
  if ((/ParamSpec\b/).test(type))
    return '{ kind: \'number\', default: 1 }'
  if ((/PoissonDiskOptions\b/).test(type))
    return '{ width: 4, height: 4, minDist: 0.5, rng: Math.random }'
  if ((/GpuEmitterOptions\b/).test(type))
    return '{ capacity: 256, seed: 7 }'
  if ((/EmitterOptions\b/).test(type))
    return '{ capacity: 256, seed: 7, color: [[0, \'#6fe7d2\'], [1, \'#ff7ab6\']] }'
  if ((/ParticleEmitterOptions\b/).test(type))
    return '{ count: 256, seed: 7 }'
  if ((/RenderOptions\b/).test(type))
    return '{ canvas, background: \'#10131a\' }'
  if ((/Record<string, unknown>/).test(type))
    return '{}'
  if ((/GLTFLoaderOptions\b/).test(type) || name.toLowerCase() === 'options')
    return '{}'
  return '{}'
}

function synthesizeParamValue (param: ParsedParam): string {
  if (param.destructuredFields)
    return synthesizeDestructuredParam(param)

  const name  = param.name.replace(/^\.\.\./, '')
  const lower = name.toLowerCase()
  const type  = param.type

  if ((/FrameCallback\b|\(\s*.*FrameContext.*\)\s*=>|callback|cb/i).test(type) || lower === 'cb' || lower.includes('callback'))
    return '() => {}'
  if ((/THREE\.Object3D\[\]|Object3D\[\]/).test(type))
    return '[demoMesh]'
  if ((/THREE\.Mesh\[\]|Mesh\[\]/).test(type))
    return '[demoMesh]'
  if ((/THREE\.BufferGeometry\[\]|BufferGeometry\[\]/).test(type))
    return '[demoGeometry.clone(), new THREE.ConeGeometry(0.6, 1.2, 6)]'
  if ((/THREE\.Matrix4\[\]|Matrix4\[\]/).test(type))
    return '[new THREE.Matrix4(), new THREE.Matrix4().makeTranslation(1.6, 0, 0)]'
  if ((/THREE\.Vector3\[\]|Vector3\[\]/).test(type))
    return 'demoVectorPoints'
  if ((/number\[\]/).test(type))
    return lower.includes('time') ? '[0, 1, 2]' : '[0, 1, 0]'
  if ((/ScalarCurve\b/).test(type))
    return '[[0, 0], [0.5, 1], [1, 0]]'
  if ((/ColorCurve\b/).test(type))
    return '[[0, \'#6fe7d2\'], [1, \'#ff7ab6\']]'
  if ((/ReadonlyArray<readonly \[number, number, number\]>/).test(type))
    return 'demoPoints'
  if ((/ReadonlyArray<readonly \[number, number\]/).test(type))
    return 'demoProfile'
  if ((/readonly \[number, number, number\]|\[number, number, number\]|Vec3Tuple\b/).test(type))
    return '[0, 1, 0]'
  if ((/readonly \[number, number\]|\[number, number\]/).test(type))
    return '[0, 1]'
  if ((/MaskLayer\[\]/).test(type))
    return '[]'

  if ([ 'scene', 'camera', 'renderer', 'canvas', 'loop' ].includes(name))
    return name
  if ((/WebGlPassContext\b/).test(type))
    return 'postContext'
  if ((/HTMLCanvasElement\b/).test(type))
    return 'canvas'
  if ((/HTMLElement\b|Element\b/).test(type))
    return 'canvas'
  if ((/THREE\.WebGLRenderer\b|WebGLRenderer\b/).test(type))
    return 'renderer'
  if ((/THREE\.Scene\b/).test(type))
    return lower.endsWith('b') ? 'altScene' : 'scene'
  if ((/THREE\.Curve<THREE\.Vector3>|Curve<THREE\.Vector3>/).test(type))
    return 'demoCurve'
  if ((/OrthographicCamera\b/).test(type))
    return 'new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 100)'
  if ((/PerspectiveCamera\b/).test(type))
    return 'camera'
  if ((/THREE\.Camera\b|\bCamera\b/).test(type))
    return lower.endsWith('b') ? 'altCamera' : 'camera'
  if ((/DirectionalLight\b|PointLight\b/).test(type))
    return 'keyLight'
  if ((/THREE\.Vector3\b|Vector3\b/).test(type))
    return 'new THREE.Vector3(0, 1, 0)'
  if ((/THREE\.Object3D\b|Object3D\b/).test(type))
    return 'demoMesh'
  if ((/THREE\.Mesh\b/).test(type))
    return 'demoMesh'
  if ((/THREE\.Material\b|Material\b/).test(type))
    return 'demoMaterial.clone()'
  if ((/THREE\.BufferGeometry\b|BufferGeometry\b/).test(type))
    return 'demoGeometry.clone()'
  if ((/THREE\.Shape\b|\bShape\b/).test(type))
    return 'demoShape'
  if ((/THREE\.Texture\b|Texture\b/).test(type))
    return 'demoTexture'
  if ((/FrameLoop\b/).test(type))
    return 'loop'
  if ((/SceneChild\b|SceneElement\b/).test(type))
    return 'demoElement'
  if ((/ElementType\b/).test(type))
    return '\'mesh\''

  if ((/\(\)\s*=>\s*number/).test(type))
    return '() => 0.42'
  if ((/=>/).test(type))
    return lower.includes('paint') ? 'paintDemoTexture' : '() => {}'
  if ((/\bnumber\b/).test(type))
    return nameAwareNumber(name)
  if ((/\bboolean\b/).test(type))
    return 'true'
  if ((/\bstring\b/).test(type)) {
    if (lower.includes('color') || lower.includes('tint'))
      return '\'#6fe7d2\''
    if (lower.includes('path'))
      return '\'.rotation[y]\''
    if (lower === 'url' || lower === 'src')
      return '\'./replace-with-your-model.glb\''
    return stringLiteralFromUnion(type) ?? '\'demo\''
  }

  const literal = stringLiteralFromUnion(type)
  if (literal)
    return literal

  return synthesizeObjectByType(type, name)
}

function synthesizeArgs (parsed: ParsedSignature): string[] {
  return parsed.params
    .filter(param => !param.optional)
    .map(synthesizeParamValue)
}

function synthesizeStarter (entry: DocExport, parsed: ParsedSignature, kind: WiringKind): string {
  if ((/load(GLTF|Model)|createGLTFLoader|createModelCache/i).test(entry.name)) {
    return [
      '// replace the url with a real asset when you want to load a model.',
      `const result = ${entry.name === 'createGLTFLoader' || entry.name === 'createModelCache' ? `${entry.name}()` : JSON.stringify(`ready to call ${entry.name}('./model.glb')`)}`,
      `presentResult(result, '${kind}')`,
    ].join('\n')
  }

  const args         = synthesizeArgs(parsed)
  const call         = `${parsed.isClass ? `new ${entry.name}` : entry.name}(${args.join(', ')})`
  const awaitKeyword = (/^Promise</).test(parsed.returnType) ? 'await ' : ''
  return [
    `const result = ${awaitKeyword}${call}`,
    `presentResult(result, '${kind}')`,
  ].join('\n')
}

function createPlaySeed (module: ModuleMeta, entry: DocExport): PlaySeed | undefined {
  if (entry.kind === 'const' || entry.kind === 'enum') {
    return {
      moduleId:       module.id,
      exportName:     entry.name,
      flavor:         flavorFor(module, entry, 'value'),
      kind:           'value',
      code:           `const result = ${entry.name}\npresentResult(result, 'value')`,
      requiresWebGpu: module.id === 'webgpu',
    }
  }

  if (entry.kind !== 'function' && entry.kind !== 'class')
    return undefined

  const parsed = parseSignature(entry)
  if (!parsed)
    return undefined

  const kind = classifyReturn(entry, parsed)
  return {
    moduleId:       module.id,
    exportName:     entry.name,
    flavor:         flavorFor(module, entry, kind),
    kind,
    code:           synthesizeStarter(entry, parsed, kind),
    requiresWebGpu: module.id === 'webgpu',
  }
}

function relatedDemos (module: ModuleMeta, name: string, kind: string): string[] {
  const lower = `${module.id} ${name} ${kind}`.toLowerCase()
  const demos = new Set<string>()
  const add = (...slugs: string[]) => slugs.forEach(slug => demos.add(slug))

  if (module.id === 'webgpu')
    add('effects')
  if (module.id.startsWith('jsx'))
    add('jsx-scene')
  if (/app|clock|store|renderer|frame|resize|pointer|dispose|quality|overlay|projection|bootstrap/.test(lower))
    add('bootstrap', 'minimal-scene')
  if (/camera|iso|follow|target|path/.test(lower))
    add('isometric', 'follow-camera')
  if (/instance|batched|building/.test(lower))
    add('instanced-field', 'batched-buildings')
  if (/shape|extrude|lathe|geometry|mesh|graph|ground|tube|merge|layout|twist|bend|taper/.test(lower))
    add('geometry', 'procedural')
  if (/material|toon|matcap|holographic|shader|triplanar|quad/.test(lower))
    add('materials', 'shader-material')
  if (/light|sun|environment|hemisphere/.test(lower))
    add('lighting')
  if (/particle|emitter|curve/.test(lower))
    add('particles')
  if (/post|pass|composer|bloom|glitch|rays|dof|film|grain|stereo|lut|chromatic|radial|outline|ssr|smaa|fxaa|retro|crt|lensing|burn/.test(lower))
    add('effects', 'post-processing')
  if (/voxel|chunk|greedy/.test(lower))
    add('voxels')
  if (/prop|registry|gltf|model/.test(lower))
    add('props')
  if (/animation|clip|track|mixer|tween|easing/.test(lower))
    add('animation')
  if (/module|pool|param|pick|view|edit|event/.test(lower))
    add('architecture')
  if (/rng|noise|poisson|procedural|body|texture|segment/.test(lower))
    add('procedural')

  if (!demos.size)
    add(module.id === 'webgpu' ? 'effects' : module.id.startsWith('jsx') ? 'jsx-scene' : 'minimal-scene')
  return [ ...demos ]
}

function sampleFor (entry: DocExport): string {
  if (entry.kind === 'interface' || entry.kind === 'type')
    return entry.signature.split('\n').slice(0, 12).join('\n')
  if (entry.kind === 'const')
    return `import { ${entry.name} } from '${packageJson.name}'\nconsole.log(${entry.name})`
  return entry.signature
}

function extractLibrary (): LibraryData {
  const modules = modulesFromPackage()
  const entries = modules.map(m => `${root}${m.entry}`)
  const program = ts.createProgram(entries, { target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler })
  const checker = program.getTypeChecker()

  const modulesWithExports = modules.map(module => {
    const sf = program.getSourceFile(`${root}${module.entry}`)
    if (!sf)
      throw new Error(`docs: missing ${module.entry}`)

    const moduleSymbol = checker.getSymbolAtLocation(sf)
    if (!moduleSymbol)
      throw new Error(`docs: missing module symbol for ${module.entry}`)

    const exports: DocExport[] = []
    for (const sym of checker.getExportsOfModule(moduleSymbol)) {
      const resolved = sym.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(sym) : sym
      const decls    = (resolved.declarations ?? []).filter(d => KIND[d.kind])
      if (!decls.length)
        continue

      const doc = ts.displayPartsToString(resolved.getDocumentationComment(checker)) ||
        ts.displayPartsToString(sym.getDocumentationComment(checker))
      const entry: DocExport = {
        name:         sym.getName(),
        kind:         KIND[decls[0]!.kind] ?? 'value',
        doc:          doc.trim(),
        summary:      summary(doc),
        signature:    decls.map(d => clean(d.kind === ts.SyntaxKind.VariableDeclaration ? d.parent.parent.getText() : d.getText())).join('\n'),
        coverage:     'type-reference',
        sample:       '',
        relatedDemos: [],
      }
      const seed = createPlaySeed(module, entry)
      entry.playSeed = seed
      entry.coverage = seed ? 'playground' : 'type-reference'
      entry.sample = sampleFor(entry)
      entry.relatedDemos = relatedDemos(module, entry.name, entry.kind)
      exports.push(entry)
    }

    const rank = (k: string): number => k === 'function' || k === 'class' ? 0 : k === 'const' || k === 'enum' ? 1 : 2
    exports.sort((a, b) => rank(a.kind) - rank(b.kind) || a.name.localeCompare(b.name))
    return { ...module, exports }
  })

  const flat = modulesWithExports.flatMap(module => module.exports)
  const missing = flat.filter(entry => !entry.playSeed && !entry.sample)
  if (missing.length)
    throw new Error(`docs: exports missing coverage: ${missing.map(e => e.name).join(', ')}`)

  return {
    version:     packageJson.version,
    packageName: packageJson.name,
    generatedAt,
    totals:      {
      exports:        flat.length,
      modules:        modulesWithExports.length,
      playable:       flat.filter(entry => entry.playSeed).length,
      typeReferences: flat.filter(entry => !entry.playSeed).length,
    },
    modules: modulesWithExports,
  }
}

function renderReadme (library: LibraryData): string {
  const lines: string[] = []
  lines.push('Generated from the built `.d.ts` files by `bun run docs`.')
  lines.push('The vite site renders the full searchable API with runnable playgrounds at')
  lines.push('[the library page](https://tuomashatakka.github.io/threejs-scenes-skill/library/) and keeps the old')
  lines.push('[`api.html`](https://tuomashatakka.github.io/threejs-scenes-skill/api.html) URL as a redirect.')
  lines.push('')
  for (const mod of library.modules) {
    lines.push(`#### \`${mod.specifier}\``)
    lines.push('')
    lines.push(mod.desc)
    lines.push('')
    for (const e of mod.exports) {
      const head = `- **\`${e.name}\`** *(${e.kind})*${e.summary ? ' — ' + e.summary : ''}`
      lines.push(head)
      if (e.kind === 'function') {
        const sig = e.signature.split('\n').filter(l => l.startsWith('function'))
          .join('\n') || e.signature
        lines.push('')
        lines.push('  ```ts')
        for (const l of sig.split('\n'))
          lines.push('  ' + l)
        lines.push('  ```')
      }
    }
    if (mod.example) {
      lines.push('')
      lines.push('  <details><summary>Example</summary>')
      lines.push('')
      lines.push('  ```ts')
      for (const l of mod.example.split('\n'))
        lines.push('  ' + l)
      lines.push('  ```')
      lines.push('  </details>')
    }
    lines.push('')
  }
  return lines.join('\n')
}

function referenceTitleAndSummary (file: string): SkillReference {
  const text = readFileSync(`${root}skill/references/${file}`, 'utf8')
  const title = text.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, '')
  const summaryText = text
    .split('\n')
    .slice(1)
    .find(line => line.trim() && !line.startsWith('#') && !line.startsWith('|'))
    ?.trim() ?? ''
  return { file, title, summary: summaryText }
}

function parseScriptsIndex (): SkillScript[] {
  const text = readFileSync(`${root}skill/scripts/INDEX.md`, 'utf8')
  const existing = new Set(readdirSync(`${root}skill/scripts`).filter(file => file.endsWith('.js')))
  const scripts: SkillScript[] = []
  let category = 'uncategorized'

  for (const line of text.split('\n')) {
    const heading = line.match(/^##\s+(.+)$/)
    if (heading)
      category = heading[1]!

    const row = line.match(/^\|\s+`([^`]+\.js)`\s+\|\s+([^|]+?)\s+\|\s+`([^`]+\.md)`\s+\|/)
    if (row) {
      scripts.push({
        file:      row[1]!,
        category,
        purpose:   row[2]!.trim(),
        reference: row[3]!,
        exists:    existing.has(row[1]!),
      })
    }
  }
  return scripts
}

function parseSkillFrontmatter (): { name: string, description: string } {
  const text = readFileSync(`${root}skill/SKILL.md`, 'utf8')
  const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim() ?? 'threejs-scenes'
  const descBlock = text.match(/^description:\s*>\n([\s\S]*?)\n---/m)?.[1] ?? ''
  return {
    name,
    description: descBlock.replace(/\n\s*/g, ' ').trim(),
  }
}

function extractSkill (): SkillData {
  const references = readdirSync(`${root}skill/references`)
    .filter(file => file.endsWith('.md'))
    .sort()
    .map(referenceTitleAndSummary)
  const scripts = parseScriptsIndex()

  const assignedRefs = new Set(SKILL_CASES.flatMap(item => item.refs))
  const missingRefs = references.filter(ref => !assignedRefs.has(ref.file))
  if (missingRefs.length)
    throw new Error(`docs: skill references missing case coverage: ${missingRefs.map(ref => ref.file).join(', ')}`)

  const assignedScripts = new Set(SKILL_CASES.flatMap(item => item.scripts))
  const missingScripts = scripts.filter(script => !assignedScripts.has(script.file))
  if (missingScripts.length)
    throw new Error(`docs: skill scripts missing case coverage: ${missingScripts.map(script => script.file).join(', ')}`)

  return {
    version:     packageJson.version,
    generatedAt,
    skill:       parseSkillFrontmatter(),
    references,
    scripts,
    cases:       SKILL_CASES,
    coverage:    {
      references: { total: references.length, covered: references.length - missingRefs.length },
      scripts:    { total: scripts.length, covered: scripts.length - missingScripts.length },
    },
  }
}

function writeJson (path: string, value: unknown): void {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`)
}

const library = extractLibrary()
const skill = extractSkill()

const readmePath = `${root}readme.md`
let readme = readFileSync(readmePath, 'utf8')
const BEGIN = '<!-- api:begin -->'
const END   = '<!-- api:end -->'
if (!readme.includes(BEGIN))
  throw new Error('readme.md is missing the <!-- api:begin --> / <!-- api:end --> markers')
readme = readme.slice(0, readme.indexOf(BEGIN) + BEGIN.length) +
  '\n' + renderReadme(library) + '\n' +
  readme.slice(readme.indexOf(END))
writeFileSync(readmePath, readme)

mkdirSync(siteGenerated, { recursive: true })
writeJson(`${siteGenerated}/library-data.json`, library)
writeJson(`${siteGenerated}/skill-data.json`, skill)
writeJson(`${siteGenerated}/demo-data.json`, { demos: DEMO_CATALOG })

const counts = library.modules.map(mod => `${mod.id}:${mod.exports.length}`)
  .join(' ')
console.log(`docs: readme.md + site data regenerated (${counts}; refs:${skill.coverage.references.covered}/${skill.coverage.references.total}; scripts:${skill.coverage.scripts.covered}/${skill.coverage.scripts.total})`)
