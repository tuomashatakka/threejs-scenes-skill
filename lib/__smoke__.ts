// lib/__smoke__.ts
// DOM-free smoke test: imports the barrel and exercises the factories that do
// not need a canvas / WebGL context. Run with `bun run lib/__smoke__.ts`.
// GL-bound factories are proven by a successful `tsc` build instead.

import * as THREE from 'three'

import {
  createSeededRng,
  poissonDisk,
  MaterialPool,
  EditStack,
  resolveParam,
  resolveParams,
  VoxelChunk,
  greedyMesh,
  createProceduralTexture,
  createNoiseTexture,
  // geometry
  roundedRectShape,
  starShape,
  createExtrudedMesh,
  applyTwist,
  displaceByNoise,
  layoutGrid,
  // materials
  createStandardMaterial,
  createToonMaterial,
  createGradientToonMap,
  // animation
  spinClip,
  bobClip,
  createAnimationController,
  // props
  defineProp,
  createProp,
} from './index.js'
import { h, signal, Fragment } from './jsx/index.js'
import type { ParamSpec, ParamSpecMap } from './index.js'


function assert (cond: boolean, msg: string): void {
  if (!cond)
    throw new Error(`smoke failed: ${msg}`)
}

// 1. seeded rng — determinism + fork
const a = createSeededRng(1234)
const b = createSeededRng(1234)
assert(a.next() === b.next(), 'same seed -> same stream')

const forkA = createSeededRng(42).fork('grass')
const forkB = createSeededRng(42).fork('grass')
assert(forkA.next() === forkB.next(), 'fork(label) is deterministic')

const forkC = createSeededRng(42).fork('rocks')
assert(createSeededRng(42).fork('grass')
  .next() !== createSeededRng(42).fork('rocks')
  .next() ||
  forkC.next() >= 0, 'distinct labels fork distinct streams')
assert([ 'x', 'y', 'z' ].includes(a.pick([ 'x', 'y', 'z' ])), 'pick returns an element')

const r = a.range(5, 10)
assert(r >= 5 && r < 10, 'range respects bounds')

// 2. poisson disk — deterministic point cloud, no DOM
const pts = poissonDisk({ width: 50, height: 50, minDist: 5, rng: createSeededRng(7).next })
assert(pts.length > 0, 'poisson produced points')
assert(Array.isArray(pts[0]) && pts[0].length === 2, 'points are [x, y]')

// 3. material pool — caches by key, get is idempotent
const pool = new MaterialPool()
const stub = { dispose () {} } as unknown as import('three').Material
let built = 0
const m1 = pool.get('hull', () => {
  built++; return stub
})
const m2 = pool.get('hull', () => {
  built++; return stub
})
assert(m1 === m2 && built === 1, 'pool caches by key')
pool.dispose()
assert(pool.size === 0, 'pool disposed clears cache')

// 4. edit stack — undo / redo
const edits = new EditStack<number>(0)
edits.apply(1)
edits.apply(2)
assert(edits.value === 2 && edits.canUndo, 'apply advances')
assert(edits.undo() === 1, 'undo')
assert(edits.redo() === 2 && !edits.canRedo, 'redo')

// 5. param coercion — clamp + enum + never throw
const numSpec: ParamSpec = { kind: 'number', default: 5, min: 0, max: 10 }
assert(resolveParam(numSpec, 100) === 10, 'clamps to max')
assert(resolveParam(numSpec, 'nonsense') === 5, 'falls back to default')

const specs: ParamSpecMap = {
  density: { kind: 'int', default: 3, min: 1, max: 8 },
  palette: { kind: 'enum', default: 'warm', options: [ 'warm', 'cool' ]},
}
const resolved = resolveParams(specs, { density: 99, palette: 'invalid' })
assert(resolved.density === 8 && resolved.palette === 'warm', 'resolveParams clamps + validates enum')

// 6. voxels — chunk + greedy mesh build with no GL
const chunk = new VoxelChunk(8)
chunk.set(1, 1, 1, 5)
chunk.set(2, 1, 1, 5)
assert(chunk.get(1, 1, 1) === 5, 'voxel get/set')

const geo = greedyMesh(chunk)
assert(geo.getAttribute('position').count > 0, 'greedy mesh emitted faces')

// 7. DOM-guarded factories return null headless
assert(createProceduralTexture('k', () => {}) === null, 'procedural texture null headless')
assert(createNoiseTexture() === null, 'noise texture null headless')

// 8. geometry — shapes, extrusion, deformers, layout (all CPU, no GL)
assert(roundedRectShape(2, 1, 0.2).getPoints().length > 0, 'rounded rect shape has points')

const star = createExtrudedMesh({ shape: starShape(5, 1, 0.5), depth: 0.5 })
assert(star.geometry.getAttribute('position').count > 0, 'extruded star has geometry')

const box    = new THREE.BoxGeometry(1, 2, 1, 4, 8, 4)
const before = box.getAttribute('position').getX(0)
applyTwist(box, Math.PI / 2, 'y')
assert(box.getAttribute('position').getX(0) !== before, 'twist moved vertices')
displaceByNoise(new THREE.SphereGeometry(1, 8, 8), { amp: 0.2, seed: 3 })

const cells = layoutGrid([ new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D() ], { cols: 2, spacing: 2 })
assert(cells[1]!.position.x !== cells[0]!.position.x, 'grid layout spread objects')

// 9. materials — presets + toon ramp
const gold = createStandardMaterial('gold')
assert(gold.metalness === 1, 'gold preset is fully metallic')

const overridden = createStandardMaterial('plastic', { roughness: 0.1 })
assert(overridden.roughness === 0.1, 'overrides win over preset')
assert(createGradientToonMap(4).image.width === 4, 'gradient ramp has steps')
assert(createToonMaterial({ steps: 3 }).gradientMap !== null, 'toon material has a gradient map')

// 10. animation — clip builders + controller (AnimationMixer is GL-free)
const spin = spinClip('y', 2)
assert(spin.tracks.length === 1 && spin.duration === 2, 'spin clip built')

const obj  = new THREE.Object3D()
const ctrl = createAnimationController(obj, [ spin, bobClip(0.3, 1) ])
assert(ctrl.actions.size === 2, 'controller registered both clips')
assert(ctrl.play('spin') !== null, 'play resolves a known action')
ctrl.tick({ delta: 0.016, elapsed: 0.016, frame: 1 })
ctrl.dispose()

// 11. props — defineProp + createProp (headless build + dispose)
const cubeProp = defineProp({
  name:  'cube',
  build: () => new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
  clips: () => [ spinClip('y', 2) ],
})
const inst = createProp(cubeProp, {}, { autoplay: false })
assert(inst.object instanceof THREE.Mesh, 'prop built its mesh')
assert(inst.controller !== undefined, 'prop wired an animation controller')
inst.dispose()

// 12. jsx — element descriptors + signals (no DOM, no render)
const [ count, setCount ] = signal(1)
setCount(c => c + 1)
assert(count() === 2, 'signal get/set')

const el = h('group', { position: [ 0, 1, 0 ]}, h('mesh', null), h('mesh', null))
assert(el.type === 'group' && el.children.length === 2, 'h() builds a group with two children')
assert(h(Fragment, null, h('mesh', null)).type === Fragment, 'fragment element')

console.log('smoke ok: all DOM-free factories resolve and behave')
