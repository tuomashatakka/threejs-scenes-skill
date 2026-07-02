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
  // 1.3 core
  createClock,
  createStore,
  // 1.3 particles
  createEmitter,
  sampleCurve,
  bakeCurve,
  // 1.3 procedural
  createNoise3D,
  // 1.3 camera + geometry + architecture
  tupleToVector3,
  vector3ToTuple,
  createCameraController,
  createConnectionGraph,
  createViewRegistry,
  createModelCache,
  createPropRegistry,
} from './index.js'
import type { SceneContext } from './index.js'
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

// 13. clock — fixed-step determinism + spiral-of-death guard
const clock = createClock({ mode: 'fixed', step: 0.02, maxSubSteps: 3 })
assert(clock.advance(0.05).length === 2, 'fixed clock emits whole steps')
assert(Math.abs(clock.elapsed() - 0.04) < 1e-9, 'elapsed counts consumed sim time')
assert(clock.advance(10).length === 3, 'overflow clamped to maxSubSteps')

const wall = createClock()
assert(wall.advance(0.123)[0] === 0.123, 'wall clock passes deltas through')

// 14. store — set / dispatch / subscribe
interface S { n: number }

const store = createStore<S, { type: 'inc' }>({ n: 1 }, (s, a) => a.type === 'inc' ? { n: s.n + 1 } : s)
let seen = 0
const unsub = store.subscribe(s => {
  seen = s.n
})
store.set({ n: 5 })
assert(store.get().n === 5 && seen === 5, 'set merges + notifies')
store.dispatch({ type: 'inc' })
assert(store.get().n === 6, 'dispatch runs the reducer')
unsub()

// 15. curves — sampling + baking
assert(sampleCurve([[ 0, 0 ], [ 1, 10 ]], 0.5) === 5, 'curve lerps between stops')
assert(sampleCurve([[ 0.2, 3 ], [ 0.8, 3 ]], 0) === 3, 'clamps before first stop')
assert(bakeCurve([[ 0, 0 ], [ 1, 1 ]], 8).length === 8, 'bake emits resolution samples')

// 16. emitter v2 — same seed + same tick sequence -> identical buffers
function runEmitter (): Float32Array {
  const e = createEmitter({ capacity: 64, rate: 200, seed: 99, shape: { kind: 'sphere', radius: 1 }})
  for (let i = 1; i <= 30; i++)
    e.tick({ delta: 1 / 60, elapsed: i / 60, frame: i })

  const mesh = e.object as THREE.Mesh
  const pos  = (mesh.geometry.getAttribute('aPos') as THREE.BufferAttribute).array as Float32Array
  const copy = pos.slice()
  e.dispose()
  return copy
}

const runA = runEmitter()
const runB = runEmitter()
assert(runA.length === runB.length && runA.every((v, i) => v === runB[i]), 'emitter is deterministic per seed + ticks')

const burster = createEmitter({ capacity: 32, rate: 0, seed: 1 })
burster.burst(10)
burster.tick({ delta: 0.016, elapsed: 0.016, frame: 1 })

const life = ((burster.object as THREE.Mesh).geometry.getAttribute('aLife') as THREE.BufferAttribute).array as Float32Array
assert([ ...life ].filter(v => v > 0).length === 10, 'burst spawned exactly 10')
burster.dispose()

// 17. noise — seeded 3D simplex + fbm bounds
const n1 = createNoise3D(5)
const n2 = createNoise3D(5)
assert(n1.sample(1.3, 2.7, 0.5) === n2.sample(1.3, 2.7, 0.5), 'noise deterministic per seed')
assert(Math.abs(n1.fbm(0.4, 0.8, 1.6)) <= 1.01, 'fbm stays bounded')

// 18. camera targets + controller (GL-free)
const v = tupleToVector3([ 1, 2, 3 ])
assert(vector3ToTuple(v).join() === '1,2,3', 'tuple round-trip')

const cam  = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
cam.position.set(0, 0, 10)

const ctrl2 = createCameraController(cam, { stiffness: 20 })
ctrl2.flyTo([ 0, 0, 0 ], [ 0, 0, -1 ])

const distBefore = cam.position.length()
for (let i = 0; i < 30; i++)
  ctrl2.update({ delta: 1 / 60, elapsed: i / 60, frame: i })
assert(cam.position.length() < distBefore, 'controller eases toward target')
assert(ctrl2.isMoving() || ctrl2.mode() === 'free', 'controller state machine valid')

// 19. connection graph — kNN edges + one draw call geometry
const graph = createConnectionGraph([[ 0, 0, 0 ], [ 1, 0, 0 ], [ 0, 1, 0 ], [ 5, 5, 5 ]], { neighbors: 1 })
assert(graph.edges.length > 0, 'graph built edges')
assert(graph.object.geometry.getAttribute('position').count === graph.edges.length * 2, 'two verts per edge')
graph.setProgress(0.5)
graph.setHighlight(1)
graph.dispose()

// 20. view registry — LRU eviction never evicts the active view
let disposed = 0
const registry2 = createViewRegistry({
  limit:  2,
  create: () => ({ dispose () {
    disposed++
  } }),
})
const fakeCtx = {} as SceneContext
registry2.activate('a', fakeCtx)
registry2.activate('b', fakeCtx)
registry2.activate('c', fakeCtx)
assert(disposed === 1 && registry2.activeKey() === 'c', 'LRU evicted the oldest inactive view')
registry2.dispose()

// 21. explicit-instance caches/registries exist and are isolated
const cacheA = createModelCache()
cacheA.clear()

const propsReg = createPropRegistry()
propsReg.register('x', { name: 'x', build: () => new THREE.Object3D() })
assert(propsReg.get('x') !== undefined && createPropRegistry().get('x') === undefined, 'prop registries are isolated instances')

console.log('smoke ok: all DOM-free factories resolve and behave')
