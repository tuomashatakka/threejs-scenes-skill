# Performance

Diagnose before optimizing. Most three.js perf problems fall into one of three
buckets: too many draw calls, too much fragment work, or too much GC pressure.

## Bottleneck Taxonomy

Open `renderer.info.render` and check:

- `calls` > 200 → draw-call problem.
- `triangles` huge, `calls` low → geometry problem (too many verts, no LOD).
- Neither, but FPS is bad → fragment problem (shaders, overdraw,
  post-processing, oversized shadow maps).
- Periodic stutters with low average frame time → GC pressure or shader
  recompile stalls.

## Draw Calls

Target < 100 draw calls for 60fps on mid-range mobile. Strategies in order:

1. **Share materials.** Creating a new material per mesh defeats three.js's
   auto-batching.
2. **Merge static geometry** with `mergeGeometries` from `BufferGeometryUtils`.
3. **Instance dynamic repeats** with `InstancedMesh`.
4. **Batch varied geometries** sharing a material with `BatchedMesh`.
5. **Texture atlas** to collapse material variants into one.

```js
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const merged = mergeGeometries([geo1, geo2, geo3])
const mesh = new THREE.Mesh(merged, sharedMaterial)
```

## Fragment Cost

- **Overdraw is invisible until you measure it.** Transparent particles,
  layered post-processing, and full-screen quads stack fragment cost. Use
  Spector.js to inspect.
- **Shadow map resolution** is fragment cost squared. 2048² is usually plenty;
  4096² should be justified.
- **Pixel ratio** clamped to 2 max. Retina × pixelRatio 3 = 9× the fragments.
- **Post-processing chain length.** Each pass = one fullscreen fragment shader.
  Combine where possible.

## Memory and GC

- **No per-frame allocations.** Pre-declare scratch `Vector3`, `Matrix4`,
  `Quaternion`, `Color`, `Raycaster` at module scope.
- **Dispose on unmount.** Recurse the scene, dispose geometries, materials,
  textures, render targets. Three.js does NOT auto-dispose.
- **Texture memory dominates GPU memory.** A 4K RGBA mipmapped texture =
  ~85 MB. Compressed KTX2: ~5–10 MB.

```js
// utils/dispose.js
export function disposeScene (root) {
  root.traverse(obj => {
    if (obj.geometry) obj.geometry.dispose()
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const mat of materials) {
        for (const key in mat) {
          const val = mat[key]
          if (val && typeof val === 'object' && 'minFilter' in val) {
            val.dispose()   // texture
          }
        }
        mat.dispose()
      }
    }
  })
}
```

## Asset Pipeline

- **glTF + Draco + Meshopt + KTX2** compression. Use `@gltf-transform/cli` to
  optimize:

  ```bash
  gltf-transform optimize input.glb output.glb \
    --compress draco --texture-compress ktx2
  ```

- **LOD** via `LOD` group with 2–3 detail tiers swapping at distance:

  ```js
  const lod = new THREE.LOD()
  lod.addLevel(meshHigh, 0)
  lod.addLevel(meshMid,  10)
  lod.addLevel(meshLow,  50)
  scene.add(lod)
  ```

- **Frustum culling** stays on for everything except single giant InstancedMeshes
  covering huge area (terrain grass) — disable manually there.

## Profiling Toolkit

- **stats.js** — FPS / ms / memory panel. Add early.
- **`renderer.info`** — draw calls, triangles, geometries, textures, programs.
- **Spector.js** — capture and inspect a frame's WebGL calls. Browser extension.
- **Chrome DevTools Performance tab** — find JS hotspots, GC events, layout
  thrashes.
- **`renderer.compile(scene, camera)`** — pre-warm shaders to avoid first-frame
  stall.
- **lil-gui** — live parameter sweeps during tuning.

## Quality Tiers

Detect tier at boot:

```js
function detectTier () {
  const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 1280
  const cores = navigator.hardwareConcurrency || 4
  const dpr = window.devicePixelRatio
  if (isMobile || cores <= 4) return 'mobile'
  if (cores >= 8 && dpr >= 2) return 'high-end'
  return 'desktop'
}

const QUALITY = {
  mobile:   { pixelRatio: 1.5, shadowSize: 1024, postFx: ['bloom'],                       chunks: 2 },
  desktop:  { pixelRatio: 2.0, shadowSize: 2048, postFx: ['bloom', 'dof', 'film-grain'],   chunks: 4 },
  highEnd:  { pixelRatio: 2.0, shadowSize: 4096, postFx: ['bloom', 'dof', 'god-rays', 'film-grain', 'glitch'], chunks: 6 },
}
```

## Common Pitfalls

- `new Material()` inside the render loop → memory leak + shader recompile stall.
- `setSize` on every resize event without debounce → thrashes the swapchain.
- `lookAt` on a parented object without calling `updateMatrixWorld` first.
- Updating `geometry.attributes.position.needsUpdate = true` every frame on a
  huge mesh — use partial updates or move to a vertex shader.
- Setting `transparent: true` on opaque materials disables depth optimizations.
- Adding lights past the scene's current light budget triggers full shader
  recompile.
- Calling `renderer.compile(scene, camera)` is mandatory pre-warm; otherwise
  first render stalls compiling shaders.
- Forgetting to dispose `WebGLRenderTarget` after post-processing — leaks
  framebuffer memory.
- `setPixelRatio(window.devicePixelRatio)` uncapped on retina mobile —
  effectively 3× the fragment work.

## Live three.js docs

- API pages: [LOD](https://threejs.org/docs/pages/LOD.html.md), [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html.md) (`.info` for draw-call/memory counters).
- Manual: `node scripts/query-threejs-docs.js manual en/optimize-lots-of-objects-animated` (also `en/cleanup`, `en/how-to-dispose-of-objects`, `en/offscreencanvas`, `en/rendering-on-demand`). Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
