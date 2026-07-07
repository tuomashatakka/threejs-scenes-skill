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
    entry:   'dist/index.d.ts',
    desc:    'The unified core WebGL API: scaffolding, rendering loops, camera controls, materials, programmatic geometry, instancing, loaders, and state management.',
    example: `import { createApp, createIsoScaffold, createToonMaterial } from '@tuomashatakka/threejs-scenes'`,
  },
  webgpu: {
    entry:   'dist/post/webgpu/index.d.ts',
    desc:    'WebGPU post-processing and node-based effects.',
    example: `import * as webgpuPost from '@tuomashatakka/threejs-scenes/webgpu'`,
  },
  jsx: {
    entry:   'dist/jsx/index.d.ts',
    desc:    'Reactive JSX layer (no React): author scenes as elements, render() mounts them, signals re-apply reactive props every frame. Component hooks (useScene, useFrame, …) expose the library’s main interfaces inside function components; useFrameLoop works anywhere.',
    example: `import { render, h, useSignal, useFrame, useScene } from '@tuomashatakka/threejs-scenes/jsx'

const [hue, setHue] = useSignal(0.5)
function Spinner () {
  const scene = useScene()
  useFrame(({ delta }) => { /* per-frame */ })
  return h('mesh', { geometry: 'box', rotationY: hue })
}
render(h(Spinner, {}), { canvas })`,
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
  const entries                          = Object.values(MODULES).map(m => root + m.entry)
  const program                          = ts.createProgram(entries, { target: ts.ScriptTarget.ES2022, moduleResolution: ts.ModuleResolutionKind.Bundler })
  const checker                          = program.getTypeChecker()
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
      const decls    = (resolved.declarations ?? []).filter(d => KIND[d.kind])
      if (!decls.length)
        continue

      const doc = ts.displayPartsToString(resolved.getDocumentationComment(checker)) ||
        ts.displayPartsToString(sym.getDocumentationComment(checker))
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
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function slugify (name: string): string {
  return 'api-' + name.replace(/\//g, '-')
}

// ------------------------------------------------------------- api play demos

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

type HarnessFlavor = 'standard' | 'post' | 'jsx'
type WiringKind = 'object3d' | 'material' | 'camera' | 'pass' | 'value'

interface PlaySeed {
  module:     string
  exportName: string
  flavor:     HarnessFlavor
  kind:       WiringKind
  code:       string
}

const PLAY_EXCLUDED_MODULES = new Set([ 'post/webgpu', 'types', 'scaffold', 'state' ])
const HARNESS_VARIABLES     = new Set([ 'scene', 'camera', 'renderer', 'canvas', 'loop' ])

function escapeJsonForHtml (value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c')
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
  return promise ? promise[1].trim() : type
}

function harnessFlavor (moduleName: string): HarnessFlavor {
  if (moduleName === 'jsx')
    return 'jsx'
  if (moduleName === 'post' || moduleName === 'post/webgl')
    return 'post'
  return 'standard'
}

function classifyReturn (moduleName: string, entry: DocExport, parsed: ParsedSignature): WiringKind {
  if (moduleName === 'loaders')
    return 'value'

  const type = unwrapReturnType(parsed.isClass ? entry.name : parsed.returnType)
  if (moduleName === 'post' || moduleName === 'post/webgl') {
    if ((/\b(Pass|ShaderPass|ComposerHandle|PostPipeline|StereoRenderer|SelectiveBloomHandle|HudBeamTransition)\b/).test(type))
      return 'pass'
  }
  if ((/\b(Camera|PerspectiveCamera|OrthographicCamera)\b/).test(type))
    return 'camera'
  if ((/Material\b|TickableMaterial\b/).test(type))
    return 'material'
  if ((/\b(Object3D|Mesh|Group|LineSegments|Points|Light|InstancedMesh|BatchedMesh|BufferGeometry|Shape|ProceduralBody|InfiniteGround|ConnectionGraph|PropInstance|PropComposite|InstancedPropResult|ChunkManager)\b/).test(type))
    return 'object3d'
  return 'value'
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
  if (HARNESS_VARIABLES.has(name))
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
  if (lower === 'displace')
    return '(x, z) => Math.sin(x * 0.7) * Math.cos(z * 0.7) * 0.2'
  if (lower === 'place')
    return null
  if (lower === 'onframe')
    return '() => {}'
  if (lower === 'oncomplete')
    return '() => {}'
  if (lower === 'state')
    return '{ hue: 0.55 }'
  if (lower === 'modules')
    return '[]'
  if (lower === 'clock')
    return null
  if (lower === 'reducer')
    return null
  if (lower === 'background')
    return '\'#0a0a14\''
  if (lower.includes('color') || lower.includes('tint'))
    return '\'#79f7ff\''
  if (lower === 'palette')
    return '[\'#14213d\', \'#79f7ff\', \'#ff7ad9\']'
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
  if (lower === 'pointerelement')
    return 'canvas'
  if (lower === 'element')
    return 'canvas'
  if (lower === 'type')
    return '\'terrestrial\''
  if (lower === 'name' || lower === 'key')
    return '\'demo\''
  if (lower === 'src' || lower === 'url')
    return '\'./replace-with-your-model.glb\''
  if (lower.includes('width'))
    return 'canvas.clientWidth'
  if (lower.includes('height'))
    return 'canvas.clientHeight'
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
  const fields = param.destructuredFields ?? []
  const props  = fields
    .map(field => {
      const value = objectLiteralFromFieldValue(field)
      return value ? `  ${field.name}: ${value}` : ''
    })
    .filter(Boolean)
  return props.length ? `{\n${props.join(',\n')}\n}` : '{}'
}

function synthesizeObjectByType (type: string, name: string, moduleName: string): string {
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
    return '{ id: \'demo\', setup: () => {}, update: () => {} }'
  if ((/ParamSpecMap\b/).test(type))
    return '{ speed: { type: \'number\', default: 1 } }'
  if ((/ParamSpec\b/).test(type))
    return '{ type: \'number\', default: 1 }'
  if ((/PoissonDiskOptions\b/).test(type))
    return '{ width: 4, height: 4, minDist: 0.5, rng: Math.random }'
  if ((/GpuEmitterOptions\b/).test(type))
    return '{ count: 256, seed: 7 }'
  if ((/EmitterOptions\b/).test(type))
    return '{ capacity: 256, seed: 7, color: [[0, \'#79f7ff\'], [1, \'#ff7ad9\']] }'
  if ((/ParticleEmitterOptions\b/).test(type))
    return '{ count: 256, seed: 7 }'
  if ((/RenderOptions\b/).test(type))
    return '{ canvas, background: \'#0a0a14\' }'
  if ((/Record<string, unknown>/).test(type))
    return '{}'
  if (moduleName === 'loaders' && (name === 'options' || (/GLTFLoaderOptions\b/).test(type)))
    return '{}'
  return '{}'
}

function synthesizeParamValue (param: ParsedParam, moduleName: string): string {
  if (param.destructuredFields)
    return synthesizeDestructuredParam(param)

  const name  = param.name.replace(/^\.\.\./, '')
  const lower = name.toLowerCase()
  const type  = param.type

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
    return '[[0, \'#79f7ff\'], [1, \'#ff7ad9\']]'
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

  if (HARNESS_VARIABLES.has(name))
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
      return '\'#79f7ff\''
    if (lower.includes('path'))
      return '\'.rotation[y]\''
    if (moduleName === 'loaders' && (lower === 'url' || lower === 'src'))
      return '\'./replace-with-your-model.glb\''
    return stringLiteralFromUnion(type) ?? '\'demo\''
  }

  const literal = stringLiteralFromUnion(type)
  if (literal)
    return literal

  return synthesizeObjectByType(type, name, moduleName)
}

function synthesizeArgs (parsed: ParsedSignature, moduleName: string): string[] {
  return parsed.params
    .filter(param => !param.optional)
    .map(param => synthesizeParamValue(param, moduleName))
}

function synthesizeLoaderStarter (parsed: ParsedSignature, kind: WiringKind): string {
  const hasAssetParam = parsed.params.some(param => (/url|src/i).test(param.name) || (/url|src/i).test(param.raw))
  if (!hasAssetParam) {
    const args = synthesizeArgs(parsed, 'loaders')
    const call = `${parsed.isClass ? `new ${parsed.name}` : parsed.name}(${args.join(', ')})`
    return [
      '// loader helpers are shown through the value fallback unless you add an asset url.',
      `const result = ${call}`,
      `presentResult(result, '${kind}')`,
    ].join('\n')
  }

  const args = synthesizeArgs(parsed, 'loaders')
  const call = `${parsed.name}(${args.join(', ')})`
  return [
    '// no bundled model asset ships with the generated api page.',
    '// replace the url below with a real gltf/glb asset, then run again.',
    'const url = \'\'',
    'if (url) {',
    `  const result = await ${parsed.name}(url)`,
    `  presentResult(result, '${kind}')`,
    '} else {',
    `  presentResult(${JSON.stringify(`ready to call ${call} once you provide an asset url`)}, 'value')`,
    '}',
  ].join('\n')
}

function synthesizeStandardStarter (parsed: ParsedSignature, moduleName: string, kind: WiringKind): string {
  if (moduleName === 'loaders')
    return synthesizeLoaderStarter(parsed, kind)

  const args         = synthesizeArgs(parsed, moduleName)
  const call         = `${parsed.isClass ? `new ${parsed.name}` : parsed.name}(${args.join(', ')})`
  const awaitKeyword = (/^Promise</).test(parsed.returnType) ? 'await ' : ''
  return [
    `const result = ${awaitKeyword}${call}`,
    `presentResult(result, '${kind}')`,
  ].join('\n')
}

function synthesizeJsxStarter (parsed: ParsedSignature, kind: WiringKind): string {
  if ((/^use[A-Z]/).test(parsed.name) && parsed.name !== 'useFrameLoop') {
    const args = synthesizeArgs(parsed, 'jsx')
    return [
      'function DemoComponent () {',
      `  const value = ${parsed.name}(${args.join(', ')})`,
      '  reportValue(\'hook value\', value)',
      '  return api.h(\'mesh\', {',
      '    geometry: new THREE.TorusKnotGeometry(0.8, 0.22, 80, 12),',
      '    material: new THREE.MeshStandardMaterial({ color: \'#79f7ff\', roughness: 0.35, metalness: 0.2 }),',
      '    rotation: () => [0, performance.now() * 0.0004, 0],',
      '  })',
      '}',
      'const result = api.render(api.h(DemoComponent, null), { canvas, background: \'#0a0a14\' })',
      `presentResult(result, '${kind}')`,
    ].join('\n')
  }

  const args = synthesizeArgs(parsed, 'jsx')
  const call = `${parsed.isClass ? `new ${parsed.name}` : parsed.name}(${args.join(', ')})`
  return [
    `const result = ${call}`,
    `presentResult(result, '${kind}')`,
  ].join('\n')
}

function createPlaySeed (moduleName: string, entry: DocExport): PlaySeed | null {
  if (PLAY_EXCLUDED_MODULES.has(moduleName) || entry.kind !== 'function' && entry.kind !== 'class')
    return null

  const parsed = parseSignature(entry)
  if (!parsed)
    return null

  const flavor = harnessFlavor(moduleName)
  const kind   = classifyReturn(moduleName, entry, parsed)
  const code   = flavor === 'jsx'
    ? synthesizeJsxStarter(parsed, kind)
    : synthesizeStandardStarter(parsed, moduleName, kind)

  return { module: moduleName, exportName: entry.name, flavor, kind, code }
}

function renderPlayControls (moduleName: string, entry: DocExport): string {
  const seed = createPlaySeed(moduleName, entry)
  if (!seed)
    return ''
  return `        <button type="button" class="play-btn" aria-expanded="false" aria-label="play demo for ${escapeHtml(entry.name)}">▶ play</button>
        <script type="application/json" class="play-seed">${escapeJsonForHtml(seed)}</script>`
}

function renderPlayRuntime (): string {
  const helpersSource = JSON.stringify(sharedHarnessHelpers())
  const runtime       = String.raw `  <script>
    (() => {
      const baseHref = new URL('.', window.location.href).href
      const moduleSpecifier = (moduleName) => moduleName === 'core' ? '@tuomashatakka/threejs-scenes' : ` + '`@tuomashatakka/threejs-scenes/${moduleName}`' + `
      const moduleUrl = (moduleName) => moduleName === 'core' ? './lib/dist/index.js' : (moduleName === 'webgpu' ? './lib/dist/post/webgpu/index.js' : ` + '`./lib/dist/${moduleName}/index.js`' + `)
      const escapeHtml = (value) => String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
      const escapeScript = (value) => String(value).replace(new RegExp('<' + '/script', 'gi'), '<\\\\/script')
      const importMap = (seed) => JSON.stringify({
        imports: {
          three: 'https://esm.sh/three@0.184.0',
          'three/addons/': 'https://esm.sh/three@0.184.0/addons/',
          'three/webgpu': 'https://esm.sh/three@0.184.0/webgpu',
          'three/tsl': 'https://esm.sh/three@0.184.0/tsl',
          '@tuomashatakka/canvas-loop-framecapper': './lib/vendor/canvas-loop-framecapper/index.js',
          react: 'https://esm.sh/react@19',
          [moduleSpecifier(seed.module)]: moduleUrl(seed.module),
        },
      }, null, 2)

      const helpersScript = () => ${helpersSource}

      function standardHarness (seed, code, mode = 'standard') {
        const specifier = moduleSpecifier(seed.module)
        const exportName = seed.exportName
        const imports = importMap(seed)
        const renderWithComposer = mode === 'post'
        return ` + "`<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <base href=\"${baseHref}\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <style>\n    html, body { margin: 0; height: 100%; background: #0a0a14; overflow: hidden; font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: #cfe0ff }\n    main { position: fixed; inset: 0 }\n    canvas { display: block; width: 100%; height: 100%; touch-action: none }\n    aside { position: fixed; left: 10px; top: 10px; right: 10px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; font-size: 11px; line-height: 1.4 }\n    aside span, pre { padding: 6px 8px; border: 1px solid #2a3346; border-radius: 6px; background: rgba(10, 12, 20, 0.72) }\n    pre { position: fixed; left: 10px; right: 10px; bottom: 10px; max-height: 34%; margin: 0; overflow: auto; white-space: pre-wrap; color: #ffb38a }\n    b { color: #79f7ff }\n  </style>\n  <script type=\"importmap\">${imports}<\\/script>\n</head>\n<body>\n  <main><canvas id=\"scene\"></canvas><aside><span>${escapeHtml(seed.module)} · <b>${escapeHtml(exportName)}</b></span><span id=\"stats\">starting</span></aside><pre id=\"report\" hidden></pre></main>\n  <script type=\"module\">\n    import * as THREE from 'three'\n    import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'\n    ${renderWithComposer ? \"import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'\\n    import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'\\n    import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'\" : ''}\n    import * as api from '${specifier}'\n    const { ${exportName} } = api\n    const PLAY_MODE = '${mode}'\n    ${helpersScript(seed, code, mode)}\n    startDemoLoop({ composerEnabled: ${renderWithComposer} })\n    try {\n${escapeScript(code).split('\\n').map(line => `      ${line}`).join('\\n')}\n    } catch (error) {\n      showError(error)\n    }\n  <\\/script>\n</body>\n</html>`" + `
      }

      function jsxHarness (seed, code) {
        const specifier = moduleSpecifier(seed.module)
        const exportName = seed.exportName
        const imports = importMap(seed)
        return ` + "`<!doctype html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"utf-8\">\n  <base href=\"${baseHref}\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n  <style>\n    html, body { margin: 0; height: 100%; background: #0a0a14; overflow: hidden; font-family: ui-monospace, 'SF Mono', Menlo, monospace; color: #cfe0ff }\n    canvas { display: block; width: 100%; height: 100%; touch-action: none }\n    aside { position: fixed; left: 10px; top: 10px; right: 10px; display: flex; justify-content: space-between; gap: 10px; pointer-events: none; font-size: 11px; line-height: 1.4 }\n    aside span, pre { padding: 6px 8px; border: 1px solid #2a3346; border-radius: 6px; background: rgba(10, 12, 20, 0.72) }\n    pre { position: fixed; left: 10px; right: 10px; bottom: 10px; max-height: 34%; margin: 0; overflow: auto; white-space: pre-wrap; color: #ffb38a }\n    b { color: #79f7ff }\n  </style>\n  <script type=\"importmap\">${imports}<\\/script>\n</head>\n<body>\n  <canvas id=\"scene\"></canvas><aside><span>${escapeHtml(seed.module)} · <b>${escapeHtml(exportName)}</b></span><span id=\"stats\">jsx runtime</span></aside><pre id=\"report\" hidden></pre>\n  <script type=\"module\">\n    import * as THREE from 'three'\n    import * as api from '${specifier}'\n    const { ${exportName} } = api\n    const canvas = document.querySelector('#scene')\n    const report = document.querySelector('#report')\n    const stats = document.querySelector('#stats')\n    const demoElement = api.h('scene', { background: '#0a0a14' },\n      api.h('camera', { type: 'perspective', position: [0, 2.5, 7], makeDefault: true }),\n      api.h('light', { type: 'hemisphere', intensity: 0.7 }),\n      api.h('light', { type: 'spot', position: [5, 8, 3], intensity: 55, penumbra: 0.45, castShadow: true }),\n      api.h('mesh', {\n        geometry: new THREE.TorusKnotGeometry(0.8, 0.22, 80, 12),\n        material: new THREE.MeshStandardMaterial({ color: '#79f7ff', roughness: 0.35, metalness: 0.2 }),\n        rotation: () => [0, performance.now() * 0.0004, 0],\n      }),\n    )\n    function reportValue (label, value) {\n      report.hidden = false\n      report.textContent = `${label}: ${formatValue(value)}`\n    }\n    function formatValue (value) {\n      if (value === undefined) return 'undefined'\n      if (value === null) return 'null'\n      if (typeof value === 'function') return value.toString().slice(0, 120)\n      try { return JSON.stringify(value, null, 2) ?? String(value) }\n      catch { return String(value) }\n    }\n    function presentResult (result) {\n      if (result?.type && result?.props && typeof api.render === 'function') {\n        const handle = api.render(result, { canvas, background: '#0a0a14' })\n        stats.textContent = 'rendered scene element'\n        window.__disposeScene = () => handle.dispose?.()\n        window.__SCENE_READY__ = true\n        return\n      }\n      if (result?.scene && result?.dispose) {\n        stats.textContent = 'render handle ready'\n        window.__disposeScene = () => result.dispose?.()\n        window.__SCENE_READY__ = true\n        return\n      }\n      reportValue('result', result)\n      if (typeof api.render === 'function') {\n        const handle = api.render(demoElement, { canvas, background: '#0a0a14' })\n        window.__disposeScene = () => handle.dispose?.()\n      }\n      window.__SCENE_READY__ = true\n    }\n    function showError (error) {\n      report.hidden = false\n      report.textContent = error?.stack || error?.message || String(error)\n      stats.textContent = 'error'\n      window.__SCENE_READY__ = true\n    }\n    try {\n${escapeScript(code).split('\\n').map(line => `      ${line}`).join('\\n')}\n    } catch (error) {\n      showError(error)\n    }\n  <\\/script>\n</body>\n</html>`" + `
      }

      function buildHarness (seed, code) {
        if (seed.flavor === 'jsx')
          return jsxHarness(seed, code)
        if (seed.flavor === 'post')
          return standardHarness(seed, code, 'post')
        return standardHarness(seed, code, 'standard')
      }

      function createPanel (card, seed) {
        const panel = document.createElement('div')
        panel.className = 'api-playground'
        const editor = document.createElement('textarea')
        editor.className = 'play-editor'
        editor.spellcheck = false
        editor.value = seed.code
        editor.setAttribute('aria-label', \`editable demo code for \${seed.exportName}\`)
        const actions = document.createElement('div')
        actions.className = 'play-actions'
        const run = document.createElement('button')
        run.type = 'button'
        run.className = 'run-btn'
        run.textContent = '▶ run'
        const status = document.createElement('span')
        status.className = 'play-status'
        status.textContent = \`\${seed.flavor} harness\`
        actions.append(run, status)
        const preview = document.createElement('div')
        preview.className = 'api-preview play-preview'
        const iframe = document.createElement('iframe')
        iframe.title = \`\${seed.exportName} generated demo\`
        iframe.sandbox = 'allow-scripts allow-same-origin'
        preview.append(iframe)
        const execute = () => {
          status.textContent = 'running'
          iframe.srcdoc = buildHarness(seed, editor.value)
          iframe.addEventListener('load', () => { status.textContent = 'running in iframe' }, { once: true })
        }
        run.addEventListener('click', execute)
        panel.append(editor, actions, preview)
        card.append(panel)
        execute()
        return panel
      }

      document.addEventListener('click', (event) => {
        const button = event.target.closest?.('.play-btn')
        if (!button)
          return
        const card = button.closest('.api-card')
        const seedEl = card?.querySelector('.play-seed')
        if (!card || !seedEl)
          return
        let panel = card.querySelector('.api-playground')
        if (!panel) {
          const seed = JSON.parse(seedEl.textContent)
          panel = createPanel(card, seed)
        } else {
          panel.hidden = !panel.hidden
        }
        button.setAttribute('aria-expanded', String(!panel.hidden))
      })
    })()
  </script>`
  return runtime.replace(
    'report.textContent = `${label}: ${formatValue(value)}`',
    "report.textContent = label + ': ' + formatValue(value)",
  )
}

function sharedHarnessHelpers (): string {
  return String.raw `
    const canvas = document.querySelector('#scene')
    const report = document.querySelector('#report')
    const stats = document.querySelector('#stats')
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a0a14')
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    camera.position.set(4, 3, 6)
    const altScene = new THREE.Scene()
    const altCamera = new THREE.PerspectiveCamera(50, 1, 0.1, 200)
    altCamera.position.set(-4, 2.5, 5)
    altCamera.lookAt(0, 0, 0)

    let theta = Math.atan2(camera.position.x, camera.position.z)
    let phi = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z))
    let radius = camera.position.length()
    const updateCamera = () => {
      const r = radius * Math.cos(phi)
      camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r)
      camera.lookAt(0, 0, 0)
    }
    updateCamera()

    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = new RoomEnvironment()
    scene.environment = pmrem.fromScene(env, 0.04).texture
    scene.environmentIntensity = 0.6
    pmrem.dispose()
    env.traverse((object) => object.geometry?.dispose())
    const keyLight = new THREE.DirectionalLight('#fff5e0', 2.4)
    keyLight.position.set(8, 12, 6)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    const hemi = new THREE.HemisphereLight('#a0c0ff', '#3a2a1a', 0.45)
    scene.add(keyLight, keyLight.target, hemi)

    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(7, 48),
      new THREE.MeshStandardMaterial({ color: '#141a2a', roughness: 0.9 }),
    )
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -1.2
    floor.receiveShadow = true
    scene.add(floor)

    const demoMaterial = new THREE.MeshStandardMaterial({ color: '#79f7ff', roughness: 0.42, metalness: 0.16, flatShading: true })
    const demoGeometry = new THREE.IcosahedronGeometry(1, 1)
    const demoMesh = new THREE.Mesh(demoGeometry.clone(), demoMaterial.clone())
    const demoShape = new THREE.Shape()
    demoShape.moveTo(-0.8, -0.5)
    demoShape.lineTo(0.7, -0.55)
    demoShape.lineTo(0.9, 0.35)
    demoShape.quadraticCurveTo(0, 0.85, -0.85, 0.35)
    demoShape.lineTo(-0.8, -0.5)
    const demoCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.4, 0, 0),
      new THREE.Vector3(-0.4, 0.7, 0.4),
      new THREE.Vector3(0.5, -0.2, -0.4),
      new THREE.Vector3(1.5, 0.4, 0),
    ])
    const demoPoints = [
      [-1.4, 0, 0],
      [-0.4, 0.9, 0.35],
      [0.6, -0.2, -0.35],
      [1.4, 0.5, 0.1],
    ]
    const demoVectorPoints = demoPoints.map(([x, y, z]) => new THREE.Vector3(x, y, z))
    const demoProfile = [[0.25, -1], [0.75, -0.5], [0.45, 0.25], [0.9, 0.9]]
    const demoTextureCanvas = document.createElement('canvas')
    demoTextureCanvas.width = 64
    demoTextureCanvas.height = 64
    const paintDemoTexture = (ctx = demoTextureCanvas.getContext('2d')) => {
      if (!ctx) return
      const gradient = ctx.createLinearGradient(0, 0, 64, 64)
      gradient.addColorStop(0, '#79f7ff')
      gradient.addColorStop(1, '#ff7ad9')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, 64, 64)
      ctx.fillStyle = 'rgba(10, 10, 20, 0.35)'
      for (let y = 0; y < 64; y += 8) ctx.fillRect(0, y, 64, 3)
    }
    paintDemoTexture()
    const demoTexture = new THREE.CanvasTexture(demoTextureCanvas)
    const demoFragmentShader = 'void mainImage(out vec4 fragColor, in vec2 fragCoord) { vec2 uv = fragCoord / iResolution.xy; fragColor = vec4(uv, 1.0, 1.0); }'
    const postContext = { renderer, scene, camera, width: canvas.clientWidth || 1, height: canvas.clientHeight || 1 }
    const loop = createLoop()
    const tickers = new Set()
    const mixers = []
    let featuredObject = null
    let composer = null
    let outputPass = null
    let customRender = null

    function createLoop () {
      const subs = new Set()
      const clock = new THREE.Clock()
      let frame = 0
      let raf = 0
      const tick = () => {
        const delta = clock.getDelta()
        const elapsed = clock.getElapsedTime()
        frame += 1
        for (const cb of subs) cb({ delta, elapsed, frame })
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
      return {
        onFrame (cb) { subs.add(cb); return () => subs.delete(cb) },
        dispose () { cancelAnimationFrame(raf); subs.clear() },
      }
    }

    function attachResizeObserver () {
      const ro = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect
        renderer.setSize(width, height, false)
        camera.aspect = width / Math.max(1, height)
        camera.updateProjectionMatrix()
        altCamera.aspect = camera.aspect
        altCamera.updateProjectionMatrix()
        composer?.setSize(width, height)
        customRender?.setSize?.(width, height)
        postContext.width = width
        postContext.height = height
      })
      ro.observe(canvas.parentElement ?? document.body)
      return () => ro.disconnect()
    }

    function attachPointerGesture (el) {
      const pointers = new Map()
      let lastPinch = 0
      el.style.touchAction = 'none'
      const onDown = (event) => {
        el.setPointerCapture(event.pointerId)
        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
        if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          lastPinch = Math.hypot(a.x - b.x, a.y - b.y)
        }
      }
      const onMove = (event) => {
        const point = pointers.get(event.pointerId)
        if (!point) return
        const dx = event.clientX - point.x
        const dy = event.clientY - point.y
        point.x = event.clientX
        point.y = event.clientY
        if (pointers.size === 1) {
          theta -= dx * 0.005
          phi = Math.max(-1.3, Math.min(1.3, phi + dy * 0.005))
          updateCamera()
        } else if (pointers.size === 2) {
          const [a, b] = [...pointers.values()]
          const dist = Math.hypot(a.x - b.x, a.y - b.y)
          if (lastPinch > 0)
            radius = Math.max(2, Math.min(40, radius / (dist / lastPinch)))
          lastPinch = dist
          updateCamera()
        }
      }
      const onUp = (event) => {
        pointers.delete(event.pointerId)
        if (pointers.size < 2) lastPinch = 0
      }
      const onWheel = (event) => {
        event.preventDefault()
        radius = Math.max(2, Math.min(40, radius * (1 + event.deltaY * 0.001)))
        updateCamera()
      }
      el.addEventListener('pointerdown', onDown)
      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerup', onUp)
      el.addEventListener('pointercancel', onUp)
      el.addEventListener('wheel', onWheel, { passive: false })
      return () => {
        el.removeEventListener('pointerdown', onDown)
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerup', onUp)
        el.removeEventListener('pointercancel', onUp)
        el.removeEventListener('wheel', onWheel)
      }
    }

    function disposeMaterial (material) {
      for (const key in material) {
        const value = material[key]
        if (value && typeof value === 'object' && 'minFilter' in value)
          value.dispose?.()
      }
      material.dispose?.()
    }

    function disposeScene (root) {
      root.traverse((object) => {
        object.geometry?.dispose?.()
        const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : []
        for (const material of materials)
          disposeMaterial(material)
      })
    }

    function showError (error) {
      report.hidden = false
      report.textContent = error?.stack || error?.message || String(error)
      stats.textContent = 'error'
      window.__SCENE_READY__ = true
    }

    function formatValue (value) {
      if (value === undefined) return 'undefined'
      if (value === null) return 'null'
      if (typeof value === 'string') return value
      if (typeof value === 'number' || typeof value === 'boolean') return String(value)
      if (typeof value === 'function') return value.toString().slice(0, 160)
      if (value?.constructor?.name) return '[' + value.constructor.name + ']'
      try { return JSON.stringify(value, null, 2) ?? String(value) }
      catch { return String(value) }
    }

    function showValue (value) {
      report.hidden = false
      report.textContent = 'value fallback:\n' + formatValue(value) + '\n\nedit the code and press run to wire it differently.'
    }

    function addVisibleObject (object) {
      object.traverse?.((child) => {
        child.castShadow = child.castShadow ?? true
        child.receiveShadow = child.receiveShadow ?? true
      })
      scene.add(object)
      featuredObject = object
      stats.textContent = 'scene object'
      return object
    }

    function previewMaterial (material) {
      const mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.8, 0.22, 96, 14), material)
      addVisibleObject(mesh)
      tickers.add(({ elapsed }) => {
        material.userData?.tick?.({ delta: 0, elapsed, frame: 0 })
      })
    }

    function previewGeometry (geometry) {
      const mesh = new THREE.Mesh(geometry, demoMaterial.clone())
      addVisibleObject(mesh)
    }

    function previewShape (shape) {
      const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.28, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 })
      previewGeometry(geometry)
    }

    function previewTexture (texture) {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.5),
        new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide }),
      )
      addVisibleObject(mesh)
    }

    function previewAnimation (result) {
      const mesh = addVisibleObject(demoMesh.clone())
      const clip = result.tracks ? result : new THREE.AnimationClip('generated-track', 2, [result])
      const mixer = new THREE.AnimationMixer(mesh)
      mixer.clipAction(clip).play()
      mixers.push(mixer)
      stats.textContent = 'animation clip'
    }

    function addPassBeforeOutput (pass) {
      if (!composer || !outputPass)
        return false
      const outputIndex = composer.passes.indexOf(outputPass)
      composer.passes.splice(Math.max(0, outputIndex), 0, pass)
      stats.textContent = 'post pass'
      return true
    }

    function presentResult (result, kind = 'value') {
      if (kind === 'pass') {
        if (result?.isPass && addPassBeforeOutput(result))
          return
        if (result?.render && (result?.setSize || result?.composer || result?.finalComposer)) {
          customRender = result
          stats.textContent = 'custom post renderer'
          return
        }
        if (result?.composer) {
          customRender = { render: (delta) => result.render?.(delta) ?? result.composer.render(delta), setSize: result.setSize?.bind(result) }
          stats.textContent = 'composer handle'
          return
        }
      }
      if (!result) {
        showValue(result)
        return
      }
      if (kind === 'camera' || result.isCamera) {
        scene.add(new THREE.CameraHelper(result))
        stats.textContent = 'camera helper'
        return
      }
      if (result.isObject3D) {
        addVisibleObject(result)
        return
      }
      for (const key of ['object', 'mesh', 'points', 'root']) {
        if (result[key]?.isObject3D) {
          addVisibleObject(result[key])
          if (typeof result.tick === 'function')
            tickers.add(ctx => result.tick(ctx))
          if (typeof result.update === 'function')
            tickers.add(ctx => result.update(ctx))
          return
        }
      }
      if (kind === 'material' || result.isMaterial || /Material$/.test(result.constructor?.name ?? '')) {
        previewMaterial(result)
        return
      }
      if (result.isBufferGeometry || result.attributes?.position) {
        previewGeometry(result)
        return
      }
      if (result instanceof THREE.Shape || Array.isArray(result.curves)) {
        previewShape(result)
        return
      }
      if (result.isTexture) {
        previewTexture(result)
        return
      }
      if (result.tracks || /KeyframeTrack$/.test(result.constructor?.name ?? '')) {
        previewAnimation(result)
        return
      }
      if (typeof result === 'function') {
        tickers.add(result)
        showValue('[registered frame callback]')
        return
      }
      showValue(result)
    }

    function startDemoLoop ({ composerEnabled }) {
      const detachResize = attachResizeObserver()
      const detachGesture = attachPointerGesture(canvas)
      if (composerEnabled) {
        composer = new EffectComposer(renderer)
        composer.addPass(new RenderPass(scene, camera))
        outputPass = new OutputPass()
        composer.addPass(outputPass)
      }
      renderer.compile(scene, camera)
      let acc = 0
      let frames = 0
      loop.onFrame((ctx) => {
        for (const ticker of tickers)
          ticker(ctx)
        for (const mixer of mixers)
          mixer.update(ctx.delta)
        if (featuredObject)
          featuredObject.rotation.y += ctx.delta * 0.35
        if (customRender)
          customRender.render(ctx.delta)
        else if (composer)
          composer.render(ctx.delta)
        else
          renderer.render(scene, camera)
        acc += ctx.delta
        frames += 1
        if (acc >= 0.5) {
          stats.textContent = Math.round(frames / acc) + ' fps - ' + renderer.info.render.calls + ' calls'
          acc = 0
          frames = 0
        }
      })
      window.__disposeScene = () => {
        detachGesture()
        detachResize()
        loop.dispose()
        customRender?.dispose?.()
        composer?.dispose?.()
        disposeScene(scene)
        renderer.dispose()
      }
      window.__SCENE_READY__ = true
    }
`
}

// ---------------------------------------------------------------- readme.md

function renderReadme (api: Record<string, DocExport[]>): string {
  const lines: string[] = []
  lines.push('Generated from the built `.d.ts` files by `bun run docs` — full declarations, doc comments,')
  lines.push('runnable examples and live previews on the [API reference page](https://tuomashatakka.github.io/threejs-scenes-skill/api.html).')
  lines.push('')
  for (const [ mod, exports ] of Object.entries(api)) {
    const meta = MODULES[mod]
    lines.push(`#### \`${mod === 'core' ? '@tuomashatakka/threejs-scenes' : '@tuomashatakka/threejs-scenes/' + mod}\``)
    lines.push('')
    lines.push(meta.desc)
    if (meta.demo)
      lines.push(`Live demo: [\`${meta.demo}.html\`](https://tuomashatakka.github.io/threejs-scenes-skill/demos/${meta.demo}.html)`)
    lines.push('')
    for (const e of exports) {
      const head = `- **\`${e.name}\`** *(${e.kind})*${e.doc ? ' — ' + summary(e.doc) : ''}`
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
  const nav     = Object.keys(api).map(m => `        <li><a href="#${slugify(m)}">${m}</a></li>`)
    .join('\n')

  const sections = Object.entries(api).map(([ mod, exports ]) => {
    const meta = MODULES[mod]
    const id   = slugify(mod)
    const demo = meta.demo
      ? `      <div class="api-preview"><iframe loading="lazy" title="${mod} live demo" src="demos/${meta.demo}.html"></iframe></div>
      <p class="demo-link"><a href="demos/${meta.demo}.html">Open demo — ${meta.demo}.html</a></p>`
      : ''
    const example = meta.example
      ? `      <pre class="api-example"><code>${escapeHtml(meta.example)}</code></pre>`
      : ''
    const cards = exports.map(e => {
      const play = renderPlayControls(mod, e)
      return `      <article class="api-card" id="${id}-${e.name.toLowerCase()}">
        <div class="api-card-head">
          <h4><code>${e.name}</code> <span class="badge">${e.kind}</span></h4>
${play}
        </div>
        ${e.doc ? `<p>${escapeHtml(e.doc)}</p>` : ''}
        <pre><code>${escapeHtml(e.signature)}</code></pre>
      </article>`
    }).join('\n')
    return `    <section id="${id}" aria-labelledby="${id}-h">
      <h2 id="${id}-h"><code>${mod === 'core' ? '@tuomashatakka/threejs-scenes' : '@tuomashatakka/threejs-scenes/' + mod}</code></h2>
      <p>${escapeHtml(meta.desc)}</p>
${example}
${demo}
${cards}
    </section>`
  })
    .join('\n\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>API reference — threejs-scenes</title>
  <meta name="description" content="Complete generated API reference for @tuomashatakka/threejs-scenes v${version}: every export, its exact declaration and doc comment, with runnable examples and live previews.">
  <link rel="stylesheet" href="styles.css">
  <style>
    .api-card { border: 1px solid #2a3346; border-radius: 8px; padding: .2rem 1rem .8rem; margin: .8rem 0; background: #10141f; }
    .api-card-head { display: flex; align-items: center; justify-content: space-between; gap: .8rem; margin: .45rem 0 .2rem; }
    .api-card h4 { margin: 0; min-width: 0; }
    .api-card pre { margin: .4rem 0 .2rem; max-height: 26em; overflow: auto; }
    .api-preview { width: 100%; aspect-ratio: 16 / 9; border: 1px solid #2a3346; border-radius: 8px; background: #0a0a14; overflow: hidden; margin: .8rem 0 .4rem; }
    .api-preview iframe { width: 100%; height: 100%; border: 0; display: block; }
    .api-example { border-left: 3px solid #79f7ff; }
    .play-seed { display: none; }
    .play-btn, .run-btn { border: 1px solid #2a6b80; border-radius: 6px; background: #10202a; color: #bdf8ff; cursor: pointer; font: inherit; line-height: 1; white-space: nowrap; }
    .play-btn { padding: .42rem .55rem; }
    .run-btn { padding: .5rem .7rem; }
    .play-btn:hover, .run-btn:hover, .play-btn:focus-visible, .run-btn:focus-visible { background: #173144; border-color: #79f7ff; outline: none; }
    .api-playground { display: grid; gap: .55rem; margin-top: .7rem; }
    .play-editor { box-sizing: border-box; width: 100%; min-height: 13rem; resize: vertical; border: 1px solid #2a3346; border-radius: 8px; padding: .75rem; background: #0a0e18; color: #dfe8ff; font: 0.86rem/1.5 ui-monospace, "SF Mono", Menlo, Consolas, monospace; tab-size: 2; }
    .play-editor:focus { border-color: #79f7ff; outline: none; }
    .play-actions { display: flex; align-items: center; gap: .7rem; }
    .play-status { color: #8fa6cf; font-size: .85rem; }
    .play-preview { margin-top: 0; }
    @media (max-width: 640px) {
      .api-card-head { align-items: flex-start; flex-direction: column; }
      .play-btn { width: 100%; }
    }
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
${renderPlayRuntime()}
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
readme = readme.slice(0, readme.indexOf(BEGIN) + BEGIN.length) +
  '\n' + renderReadme(api) + '\n' +
  readme.slice(readme.indexOf(END))
writeFileSync(readmePath, readme)

writeFileSync(root + 'public/api.html', renderApiHtml(api))

const counts = Object.entries(api).map(([ m, e ]) => `${m}:${e.length}`)
  .join(' ')
console.log(`docs: readme.md + public/api.html regenerated (${counts})`)
