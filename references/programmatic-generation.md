# Programmatic Generation

Any time you need more than ~20 entries — geometry vertices, instance transforms,
texture pixels, color palette entries, particle attributes — generate them in
code from a parameterized factory, not a static literal. The factory becomes the
design surface.

## Seeded RNG

Every generator takes a `seed: number` option. Same seed → identical output.
Critical for testing, reproducibility, and shipping art that the team can
review without re-rolling.

```js
// utils/math/rng.js
export function mulberry32 (seed) {
  let a = seed >>> 0
  return function rng () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

## Procedural Geometry

See `scripts/procedural-crystal-geometry.js` for a working example.

Pattern:

1. Accept typed options.
2. Build `positions: number[]`, `normals: number[]`, `indices: number[]` arrays.
3. Allocate typed arrays once, set as `BufferAttribute`s.
4. `geometry.computeBoundingSphere()` so frustum culling works.

## Batch Creation Pattern

Always pair a config schema, a deterministic seed, and a single factory entry
point. Same seed → same scene.

```js
export function createForestScene ({ seed }) {
  return {
    trees:  createInstancedTrees({ seed: seed + 1, count: 5000 }),
    rocks:  createBatchedRocks({   seed: seed + 2, variantCount: 8, instanceCount: 1200 }),
    grass:  createGrassField({     seed: seed + 3, count: 50000 }),
    lights: createLanternLights({  seed: seed + 4, count: 12 }),
  }
}
```

## Poisson Disk Sampling

For natural-looking placement (forests, asteroid fields), Poisson disk beats
uniform random. It guarantees minimum spacing while looking organic.

```js
export function poissonDisk2D ({ width, height, minDist, rng, k = 30 }) {
  const cellSize = minDist / Math.SQRT2
  const cols = Math.ceil(width / cellSize)
  const rows = Math.ceil(height / cellSize)
  const grid = new Array(cols * rows).fill(null)
  const points = []
  const active = []

  const addPoint = (x, y) => {
    const p = [x, y]
    points.push(p)
    active.push(p)
    grid[Math.floor(x / cellSize) + Math.floor(y / cellSize) * cols] = p
  }

  addPoint(rng() * width, rng() * height)

  while (active.length > 0) {
    const idx = Math.floor(rng() * active.length)
    const [px, py] = active[idx]
    let placed = false
    for (let i = 0; i < k; i++) {
      const a = rng() * Math.PI * 2
      const r = minDist * (1 + rng())
      const nx = px + Math.cos(a) * r
      const ny = py + Math.sin(a) * r
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue
      const gx = Math.floor(nx / cellSize)
      const gy = Math.floor(ny / cellSize)
      let ok = true
      for (let dy = -2; dy <= 2 && ok; dy++) {
        for (let dx = -2; dx <= 2 && ok; dx++) {
          const cgx = gx + dx, cgy = gy + dy
          if (cgx < 0 || cgy < 0 || cgx >= cols || cgy >= rows) continue
          const n = grid[cgx + cgy * cols]
          if (n && (n[0] - nx) ** 2 + (n[1] - ny) ** 2 < minDist * minDist) ok = false
        }
      }
      if (ok) { addPoint(nx, ny); placed = true; break }
    }
    if (!placed) active.splice(idx, 1)
  }
  return points
}
```

## Render to Texture

For dynamic textures driven by compute or fullscreen shaders (flow maps, noise
fields, normal maps from heightmaps), render once at init into a
`WebGLRenderTarget` and reuse:

```js
const target = new THREE.WebGLRenderTarget(512, 512, { type: THREE.FloatType })
const fsQuad = new FullScreenQuad(material)
renderer.setRenderTarget(target)
fsQuad.render(renderer)
renderer.setRenderTarget(null)
// target.texture is now your generated texture
```

`FullScreenQuad` is in `three/addons/postprocessing/Pass.js`.

## Determinism Discipline

For every generated artifact, include in the output:

- The seed used.
- The factory options.
- The factory name and version.

For LLM-generated artifacts, include the prompt, model id, and schema version
as a comment header. Makes regenerations diffable.

## Common Pitfalls

- Using `Math.random()` directly instead of a seeded RNG — outputs aren't
  reproducible.
- Forgetting `geometry.computeBoundingSphere()` — frustum culling silently
  fails.
- Allocating arrays with `Array.from({ length: N }, ...)` for typed-array
  use cases — slower than typed-array constructors and triggers extra GC.
- Hand-typing more than ~20 entries — switch to a factory.
- Re-running a non-deterministic generator every reload — wraps it in
  `useMemo` or caches the result and confuses everyone.
