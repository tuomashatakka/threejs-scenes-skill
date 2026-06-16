# Anti-Patterns

Quick scan before committing. If your code does any of these, fix it.

## Stack

- **Using R3F, Drei, or any React abstraction over the scene graph.** Vanilla
  three.js only in this skill.
- **Mixing WebGPU and WebGL imports.** This skill is `three` only, not
  `three/webgpu`.
- **Writing raw GLSL strings when a `ShaderMaterial` factory pattern would do.**
  Always wrap in `/* glsl */` template literals and compose reusable chunks.

## Performance

- **Allocating `Vector3` / `Matrix4` / `Color` inside the render loop.**
  Pre-declare at module scope.
- **Creating a new `MeshStandardMaterial` per mesh** instead of sharing one.
  Defeats three.js's auto-batching.
- **Hand-typing arrays of positions, colors, or instance transforms longer
  than ~20 entries** instead of using a seeded factory.
- **`setPixelRatio(window.devicePixelRatio)` uncapped on retina.** Always
  clamp to 2 max.
- **`new Material()` inside the render loop** → memory leak + shader recompile
  stall.
- **Adding/removing lights at runtime** — triggers shader recompile for every
  affected material.
- **Calling `renderer.render()` without a prior `renderer.compile()` warm-up**
  — produces visible shader compile stalls on first frame.
- **Forgetting to dispose textures, materials, geometries, and render targets**
  on scene teardown. Three.js doesn't auto-dispose.
- **Setting `transparent: true` on opaque materials** — disables depth
  optimizations and forces back-to-front sorting.
- **Per-frame `attribute.needsUpdate = true` on a huge buffer** — uploads the
  entire array every frame. Use partial updates via `attribute.updateRange`.

## Instancing

- **Using `InstancedMesh` for varied geometries.** Use `BatchedMesh` instead.
- **Using `BatchedMesh` for one repeated geometry.** Use `InstancedMesh` —
  cheaper.
- **Setting `frustumCulled = true` on a single InstancedMesh covering a huge
  area** — three.js culls the whole mesh as one unit, which never helps for
  ground cover.

## Voxels

- **Naive voxel meshing** — emitting 6 quads per voxel at scale. Use greedy
  meshing or marching cubes.
- **Per-voxel `Mesh` instances** — death by 1000 draw calls.
- **Rebuilding the world every edit** — only remesh affected chunks (and
  their boundary neighbors).

## Camera & Input

- **Using `mousedown` / `mousemove` / `mouseup` or `touchstart` / `touchmove` /
  `touchend`.** Pointer events only.
- **Orbit / camera controls without `enableDamping`** or with damping factor 0
  on touch — feels jittery on touchscreens.
- **Missing `el.setPointerCapture(e.pointerId)` in `pointerdown`** — drag
  breaks when the pointer leaves the canvas.
- **Forgetting `touch-action: none` on the canvas** — iOS Safari fires native
  pinch/scroll on top of your handlers.
- **Resize handler on `window.resize`** instead of `ResizeObserver` — misses
  devtools-induced layout changes.
- **Moving the camera infinitely** in an open world instead of rebasing the
  origin around a threshold.

## Post-Processing

- **Stacking unrelated effects in one shader.** Keep each pass single-purpose
  so it can be disabled per perf tier.
- **Putting `OutputPass` before effect passes** — corrupts color space.
- **Forgetting to attach a `DepthTexture` to the composer** when DOF / god
  rays need it.
- **`composer.setSize()` not called on resize** → blurry/stretched output.
- **Mixing `composer.render()` and `renderer.render()`** in the same frame.

## Particles

- **Using `Sprite` (not `Points` / `InstancedMesh`) for 10k+ particles** —
  each `Sprite` is one draw call.
- **`Math.random()` per particle per frame on CPU** — pre-bake randomness
  into attributes once.
- **`depthWrite: true` on transparent particles** — they occlude each other
  weirdly.

## Lighting

- **Using `AmbientLight` as a sole light source** — flattens everything,
  looks dead. Use `HemisphereLight` or IBL.
- **4096² shadow maps "just to be safe"** — usually overkill and tanks mobile
  FPS.
- **Shadow camera frustum sized to the whole world** — depth precision
  collapses; shadows look chunky everywhere.

## Styling

- **Tailwind, Shadcn, Radix, CSS Modules, styled-components, vanilla-extract,
  or `className` as a styling prop anywhere** in the codebase.
- **Div-soup**. Use HTML5 landmark elements: `header`, `main`, `nav`,
  `dialog`, `article`, `section`.
- **Class selectors when a tag selector would do.** Style `button`, `h1`,
  `nav a` directly.

## LLM Codegen

- **Asking the LLM to emit raw GLSL strings** — they break compile silently.
  Use the recipe pattern.
- **Forgetting to embed seed + model id** in the emitted file — output
  becomes un-reproducible.
- **Letting the LLM choose data structures freely** — wrap every output in a
  zod schema.
- **`maxToolRoundtrips` uncapped** — agent loops can run away. Cap at 6–10.

## Loop Management

- **Multiple competing `requestAnimationFrame` loops.** Use a single
  `frameLoopManager` from `@tuomashatakka/canvas-loop-framecapper`.
- **Closure-captured `delta` inside callbacks** — read from the manager
  argument instead.
- **Forgetting to `unregisterAsyncCallback` on teardown** — leaked callbacks
  keep references and prevent GC.
