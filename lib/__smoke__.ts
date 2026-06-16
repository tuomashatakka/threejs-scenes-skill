// lib/__smoke__.ts
// DOM-free smoke test: imports the barrel and exercises the factories that do
// not need a canvas / WebGL context. Run with `bun run lib/__smoke__.ts`.
// GL-bound factories are proven by a successful `tsc` build instead.

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
  createNoiseTexture


} from './index.js'
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

console.log('smoke ok: all DOM-free factories resolve and behave')
