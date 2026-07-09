# threejs-scenes

A Claude skill for building production-quality **three.js** WebGL scenes with
vanilla three.js (WebGL2) — no React-Three-Fiber, no Drei, no WebGPU. Just
`three` from its main entry point, authored to ship as a single self-contained
HTML artifact that runs in a sandboxed iframe with no build step.

## download

- **Skill package:** [`threejs-scenes.skill`](https://tuomashatakka.github.io/threejs-scenes-skill/threejs-scenes.skill)
  — build one locally with `bun run package:skill` (validates `SKILL.md`, refreshes the bundled lib, zips `skill/`)
  — the packaged `skill/` directory. Drop it into `~/.claude/skills/` (or
  `~/.config/opencode/skills/`) and unzip, or install it via Claude Code.
- **Live showcase:** [tuomashatakka.github.io/threejs-scenes-skill](https://tuomashatakka.github.io/threejs-scenes-skill/)
  — semantic gallery of the runnable demos plus the full API reference.

Both are published automatically by the **Publish showcase & skill** GitHub
Actions workflow (`.github/workflows/publish.yml`) on every push to `main`.

## what it does

When a request touches three.js / WebGL / 3D-in-the-browser, this skill gives
the agent a curated body of reference docs, copy-ready script modules, and
runnable HTML templates so it can build correct, performant scenes instead of
re-deriving boilerplate every time.

It covers, end to end:

- **scene scaffolding** — renderer factory (DPR-capped, ACES, sRGB), a single
  Clock-driven frame loop, `ResizeObserver`-based resize, explicit disposal.
- **camera handling** — perspective orbit, third-person follow, isometric
  orthographic; touch-first unified pointer gestures (mouse/touch/pen identical).
- **instancing & draw-call reduction** — `InstancedMesh` and `BatchedMesh` to
  render thousands of objects in one draw call.
- **procedural generation** — seeded `mulberry32` RNG, value/simplex noise,
  Poisson-disk placement, runtime geometry/texture factories.
- **shaders** — custom `ShaderMaterial` / GLSL (fresnel, scanlines, noise).
- **post-processing** — `EffectComposer` chains: bloom, colour grade, god rays,
  depth-of-field + chromatic aberration, film grain, glitch, HUD beams, stereoscopy.
- **voxels & infinite worlds** — chunked storage, greedy meshing, origin rebasing.
- **lighting** — IBL environment + sun (tuned shadow frustum) + hemisphere fill.
- **LLM-driven content** — ai-sdk / Gemini tool schemas for generating scenes
  from text prompts, with validate-and-repair codegen flow.

## core principles

- **vanilla three.js only** — portable, artifact-friendly, no framework lock-in.
- **touch-first** — `pointer*` events exclusively, `touch-action: none` on the
  canvas, pixel ratio capped at 2.
- **one writer per concern** — a single camera writer (no double-lerp jitter),
  one frame loop, one composer.
- **dispose what you own** — three.js never auto-frees GPU memory; pooled/shared
  materials are never disposed (see `references/production-lessons.md`).
- **determinism** — seeded factories so a scene is pixel-identical across reloads.
- **draw-call discipline** — instance before you add a second mesh.

## package

This repo is **also** an importable, strictly-typed npm package that codifies
every skill pattern (and the production lessons from a shipping `scene/`
project) as well-typed factories and interfaces. Build it with `bun run build`
(emits `dist/` with `.d.ts` files); `three` is a **peer dependency**.

The root barrel is **curated**: a hand-picked set of the most-used factories at
the top level, plus the full library grouped into six domain namespaces
(`core`, `primitives`, `raster`, `compose`, `state`, `scaffold`). Every namespace
is also a tree-shakeable subpath.

```ts
import {
  // curated "hero" factories — the fast path to a running scene
  createApp, bootstrapScene, createRenderer, createFrameLoop,
  createStandardMaterial, createEmitter, createInfiniteGround,
  // domain namespaces — the whole library, grouped by concern
  core, primitives, raster, compose, state, scaffold,
} from 'threejs-scenes'

const app = createApp({ canvas })              // renderer + scene + camera + lighting + orbit + loop
const chunk = new primitives.VoxelChunk(16)    // deep API lives in its namespace
app.start()

// or import a single domain directly (best for tree-shaking):
import { createBatchedBuildings } from 'threejs-scenes/primitives'
import { createComposer, createGradePass } from 'threejs-scenes/raster'
```

Public entry points:
- `threejs-scenes` — curated root: hero factories + the six domain namespaces
- `threejs-scenes/core` — renderer, frame loop (incl. worker updates), clocks, store, createApp, input, projection, disposal, quality
- `threejs-scenes/primitives` — geometry, materials, procedural, instancing, voxels
- `threejs-scenes/raster` — lighting, cameras, post-processing, particles
- `threejs-scenes/compose` — scene modules, props, loaders, animation, skybox, events
- `threejs-scenes/state` — controller protocol, tween/lerp transitions (store lives in `/core`)
- `threejs-scenes/scaffold` — one-call genre wiring (iso, orbit, tpp, rails, fps)
- `threejs-scenes/webgpu` — dedicated WebGPU post-processing and TSL effects
- `threejs-scenes/jsx` — declarative, reactive JSX layer
- `threejs-scenes/lib/*` — raw, uncompiled TypeScript source (bundler-resolved; mirrors `dist/*` 1:1)

### hooks (`/jsx`)

The `threejs-scenes/jsx` subpath exposes the library's main interfaces as
**hooks** (no React required). Inside a JSX function component the reconciler
provides the mounting runtime, so `useScene()`, `useRenderer()`, `useCamera()`,
`useLoop()`, `useRng()`, `useSize()`, `useAspect()`, `useFrame(cb)` and
`useDispose(fn)` just work; `useFrameLoop(cb?, { fps })` and
`useSignal` / `useDerived` are callable anywhere.

```tsx
import { render, h, useFrame, useSignal } from 'threejs-scenes/jsx'

function Spinner () {
  const [angle, setAngle] = useSignal(0)
  useFrame(({ delta }) => setAngle(a => a + delta))
  return <mesh geometry='box' rotationY={angle} />
}
render(<Spinner />, { canvas })
```

### API reference

<!-- api:begin -->
Generated from the built `.d.ts` files by `bun run docs`.
The vite site renders the full searchable API with runnable playgrounds at
[the library page](https://tuomashatakka.github.io/threejs-scenes-skill/library/) and keeps the old
[`api.html`](https://tuomashatakka.github.io/threejs-scenes-skill/api.html) URL as a redirect.

#### `threejs-scenes`

A deliberately small surface: the shared type vocabulary, a hand-picked set of the most-used factories (createApp, the scaffolds, the go-to material/geometry/light/animation/prop/particle helpers), and the six domain namespaces below. The full library is grouped by concern behind core / primitives / raster / compose / state / scaffold.

- **`applyTaper`** *(function)* — Taper: the two axes perpendicular to `axis` scale from 1 to `factor` along it.

  ```ts
  function applyTaper(geo: THREE.BufferGeometry, factor: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`applyTwist`** *(function)* — Twist around `axis`: rotation grows linearly from 0 to `angle` along the axis.

  ```ts
  function applyTwist(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`attachPointerGesture`** *(function)* — Attach unified drag/pinch/tap/wheel gesture handling to an element.

  ```ts
  function attachPointerGesture(el: HTMLElement, callbacks: PointerGestureCallbacks, { tapThresholdMs, tapMovePx }?: PointerGestureOptions): () => void;
  ```
  - `el` — Element to listen on, typically the render canvas. Its
`touch-action` style is set to `none` to disable native panning/zooming.
  - `callbacks` — Gesture handlers; all optional.
  - `options` — Tap detection thresholds. Defaults: `tapThresholdMs: 250`,
`tapMovePx: 8`.
  - returns — Detach function removing all listeners. The `touch-action` override
is not restored.
- **`attachResizeObserver`** *(function)* — Keep the renderer and camera in sync with the canvas parent's size via a.

  ```ts
  function attachResizeObserver(renderer: THREE.WebGLRenderer, camera: THREE.Camera, canvas: HTMLCanvasElement, onResize?: ResizeHandler): () => void;
  ```
  - returns — Detach function that disconnects the observer.
- **`bobClip`** *(function)* — Vertical bob (sine, seamless loop).

  ```ts
  function bobClip(amp?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`bootstrapScene`** *(function)* — Bootstrap a minimal animated scene in one call: renderer, scene, perspective.

  ```ts
  function bootstrapScene({ canvas, onSetup }: BootstrapOptions): BootstrappedScene;
  ```
  - `options` — Canvas plus optional setup callback; see BootstrapOptions.
  - returns — A BootstrappedScene exposing the live primitives and `dispose()`.

  <details><summary>Example</summary>

  ```ts
  const { dispose } = bootstrapScene({
    canvas,
    onSetup ({ scene }) {
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      return ({ delta }) => { mesh.rotation.y += delta }
    },
  })
  ```
  </details>
- **`combineClips`** *(function)* — Merge several clips into one, layering all their tracks.

  ```ts
  function combineClips(name: string, clips: THREE.AnimationClip[]): THREE.AnimationClip;
  ```
  - `name` — Name of the combined clip.
  - `clips` — Clips whose tracks are concatenated; tracks targeting the
same property will fight — combine complementary clips (spin + bob).
  - returns — One `AnimationClip` playing every input in parallel.
- **`createAnimationController`** *(function)* — Wrap an `AnimationMixer` and its actions with `play`/`crossfade`/`stop` and.

  ```ts
  function createAnimationController(root: THREE.Object3D, clips?: THREE.AnimationClip[], loop?: FrameLoop): AnimationController;
  ```
  - `root` — Object the mixer binds to (the .glb scene or a procedural prop).
  - `clips` — Clips to expose as named actions.
  - `loop` — When given, `tick` auto-registers via `registerUpdate`.
  - returns — An `AnimationController`. `dispose()` unregisters the tick, stops
all actions, and uncaches the root so nothing leaks.

  <details><summary>Example</summary>

  ```ts
  const anim = createAnimationController(model.scene, model.animations, ctx.loop)
  anim.play('walk', { fadeIn: 0.3 })
  ```
  </details>
- **`createApp`** *(function)* — Build a complete unidirectional app shell: renderer, scene, camera, seeded.

  ```ts
  function createApp<S extends object = Record<string, unknown>, A = Partial<S>>({ canvas, state, reducer, seed, clock, renderer: rendererOptions, camera: cameraOptions, background, lighting, orbit, modules, onFrame, onResize, render, }: AppOptions<S, A>): App<S, A>;
  ```
  - `options` — App configuration; see AppOptions. Only `canvas` is required.
  - returns — An App handle. `dispose()` stops the loop, detaches gestures
and the resize observer, disposes modules, lights, scene, and renderer.

  <details><summary>Example</summary>

  ```ts
  const app = createApp({
    canvas,
    state: { speed: 1 },
    modules: [ turbineModule ],
    onFrame: (state, frame) => hud.update(state, frame.delta),
  })
  app.start()
  // later: app.setState({ speed: 2 }); app.dispose()
  ```
  </details>
- **`createClock`** *(function)* — Create an injectable simulation time source for the frame loop and.

  ```ts
  function createClock({ mode, step, maxSubSteps }?: ClockOptions): Clock;
  ```
  - `options` — Mode plus fixed-step tuning. Defaults: `mode: 'wall'`,
`step: 1/60`, `maxSubSteps: 5`.
  - returns — A Clock; `reset()` zeroes the accumulator and elapsed total.
- **`createEmitter`** *(function)* — CPU-simulated billboard particle emitter: a fixed-capacity `Points` cloud.

  ```ts
  function createEmitter({ capacity, rate, bursts, lifetime, shape, speed, gravity, damping, size, sizeCurve, color, alphaCurve, rotation, texture, blending, seed, }: EmitterOptions): Emitter;
  ```
  - `options` — Capacity (buffers size once), rate/bursts, lifetime range,
spawn shape, motion, and appearance curves.
  - returns — An Emitter; add `object` to the scene and `tick` it.

  <details><summary>Example</summary>

  ```ts
  const smoke = createEmitter({ capacity: 500, shape: { kind: 'cone', angle: 0.4 } })
  scene.add(smoke.object)
  loop.onFrame(ctx => smoke.tick(ctx))
  ```
  </details>
- **`createExtrudedMesh`** *(function)* — Extrude a 2D profile into a bevelled mesh.

  ```ts
  function createExtrudedMesh(options: ExtrudeOptions): THREE.Mesh;
  ```
  - `options` — Profile, `depth` (default 1), bevel settings (on by
default), and material (default matte standard).
  - returns — The extruded mesh with shadows enabled.

  <details><summary>Example</summary>

  ```ts
  const gear = createExtrudedMesh({ shape: gearShape(12, 2, 1.4), depth: 0.5 })
  ```
  </details>
- **`createFpsScaffold`** *(function)* — First-person scaffold: pointer-lock mouse look plus WASD/arrow movement.

  ```ts
  function createFpsScaffold<S extends object = Record<string, unknown>>({ state, speed, lookSpeed, eyeHeight, pointerLock, collide, groundHeight, ...appOptions }: FpsScaffoldOptions<S>): FpsScaffold<S>;
  ```
  - `options` — State source, `speed`/`lookSpeed`/`eyeHeight`,
`pointerLock` toggle, `collide` and `groundHeight` hooks, and the remaining
`AppOptions`.
  - returns — An FpsScaffold with the app and an `orientation()` reader
for HUDs.

  <details><summary>Example</summary>

  ```ts
  const fps = createFpsScaffold({ canvas, speed: 7, groundHeight: (x, z) => terrain.height(x, z) })
  fps.app.start()
  ```
  </details>
- **`createFrameLoop`** *(function)* — Create a frame loop that shares one `requestAnimationFrame` with every other.

  ```ts
  function createFrameLoop({ clock: simClock, fps }?: FrameLoopOptions): FrameLoop;
  ```
  - `options` — Optional sim clock and fps cap; see FrameLoopOptions.
  - returns — A FrameLoop. `dispose()` stops the loop, clears subscribers,
and terminates every worker update it owns.
- **`createGpuEmitter`** *(function)* — GPGPU particle emitter: position and velocity live in float textures.

  ```ts
  function createGpuEmitter(renderer: THREE.WebGLRenderer, options: GpuEmitterOptions): Emitter;
  ```
  - `renderer` — Renderer running the compute passes (WebGL2).
  - `options` — Same appearance/motion contract as the CPU emitter.
  - returns — An Emitter; `burst`/`setRate` are no-ops — particles
respawn continuously as their lifetime wraps.
- **`createInfiniteGround`** *(function)* — Endless-looking ground from a fixed grid of displaced plane tiles that.

  ```ts
  function createInfiniteGround({ tileSize, gridRadius, segments, displace, material, }?: InfiniteGroundOptions): InfiniteGround;
  ```
  - `options` — `tileSize` (default 32), `gridRadius` (default 2 → 5×5
tiles), per-tile `segments`, a `displace(x, z)` height function, and
material.
  - returns — An InfiniteGround; `heightAt(x, z)` samples the same
displacement used for the mesh.
- **`createInstancedProp`** *(function)* — Scatter one prop as an `InstancedMesh` field: builds a single sample from.

  ```ts
  function createInstancedProp(factory: PropFactory, options: InstancedPropOptions, ctx?: PropContext): InstancedPropResult;
  ```
  - `factory` — Prop definition; its `instanced` hint merges under `options`.
  - `options` — Count/radius/seed/placement overrides.
  - `ctx` — Prop context (rng, loop).
  - returns — An InstancedPropResult ready to add to the scene.
- **`createIsoCamera`** *(function)* — Orthographic isometric camera: positioned on a 45°-yaw tilted orbit and.

  ```ts
  function createIsoCamera(aspect: number, { viewSize, flavor, near, far, }?: IsoCameraOptions): THREE.OrthographicCamera;
  ```
  - `aspect` — Viewport width / height.
  - `options` — View size, flavor, near/far planes.
  - returns — A configured `OrthographicCamera` looking at the origin.
- **`createIsoScaffold`** *(function)* — Isometric-scene scaffold in one call: `createApp` with an orthographic iso.

  ```ts
  function createIsoScaffold<S extends object = Record<string, unknown>>({ state, viewSize, flavor, near, far, pan, zoom, ground: groundOptions, ...appOptions }: IsoScaffoldOptions<S>): IsoScaffold<S>;
  ```
  - `options` — State source, iso camera flavor, pan/zoom/ground settings,
and the remaining `AppOptions`.
  - returns — An IsoScaffold exposing the app, camera, pan `focus`, and
ground handle.

  <details><summary>Example</summary>

  ```ts
  const iso = createIsoScaffold({ canvas, state: store, ground: { tile: 8 } })
  iso.app.start()
  ```
  </details>
- **`createMatcapMaterial`** *(function)* — Matcap material.

  ```ts
  function createMatcapMaterial(matcap?: THREE.Texture | string): THREE.MeshMatcapMaterial;
  ```
- **`createNoise3D`** *(function)* — Seeded 3D simplex noise (classic Gustavson, seed-shuffled permutation.

  ```ts
  function createNoise3D(seed?: number): Noise3D;
  ```
  - `seed` — Any integer; same seed → same field.
  - returns — A Noise3D with `sample`, `fbm`, and `ridged`.
- **`createOrbitScaffold`** *(function)* — Product/model-viewer scaffold: `createApp` with the built-in pointer orbit,.

  ```ts
  function createOrbitScaffold<S extends object = Record<string, unknown>>({ state, autoRotate, ...appOptions }: OrbitScaffoldOptions<S>): OrbitScaffold<S>;
  ```
  - `options` — State source, `autoRotate` speed, and the remaining
`AppOptions`.
  - returns — An OrbitScaffold with the app, the `stage` group, and
`fitTo(object, margin)` which distances the camera so the object's bounding
sphere fits with `margin` headroom (default 1.25).

  <details><summary>Example</summary>

  ```ts
  const viewer = createOrbitScaffold({ canvas, autoRotate: 0.4 })
  viewer.stage.add(model)
  viewer.fitTo(model)
  viewer.app.start()
  ```
  </details>
- **`createProp`** *(function)* — Mount a prop definition: build its object, attach declared lights, and wire.

  ```ts
  function createProp(factory: PropFactory, ctx?: PropContext, options?: CreatePropOptions): PropInstance;
  ```
  - `factory` — The prop definition (author with `defineProp`).
  - `ctx` — Prop context; pass `loop` so clips advance with the frame loop.
  - `options` — Set `autoplay: false` to leave clips stopped.
  - returns — A `PropInstance`; `dispose()` frees the controller and everything
the prop built.
- **`createPropComposite`** *(function)* — Assemble several mounted props into one `Group`, applying each part's.

  ```ts
  function createPropComposite(parts: CompositePart[]): PropComposite;
  ```
  - `parts` — Props with optional local transforms.
  - returns — A PropComposite whose `object` is ready to add to the scene.
- **`createRailsScaffold`** *(function)* — On-rails scaffold: an endless segment stream stitched into one curve and a.

  ```ts
  function createRailsScaffold<S extends object = Record<string, unknown>>({ state, segment, prefetchDistance, maxActive, lift, tension, yawRange, pitchRange, smoothing, speed, ...appOptions }: RailsScaffoldOptions<S>): RailsScaffold<S>;
  ```
  - `options` — State source, the deterministic `segment` builder,
`prefetchDistance`, plus segment-stream and path-camera tuning.
  - returns — A RailsScaffold with the app, the segment `stream`, and
the path-camera `rig`.

  <details><summary>Example</summary>

  ```ts
  const ride = createRailsScaffold({ canvas, segment: (i, rng) => tunnelSegment(rng) })
  ride.app.start()
  ```
  </details>
- **`createRenderer`** *(function)* — Create a `WebGLRenderer` with production defaults: high-performance power.

  ```ts
  function createRenderer({ canvas, antialias, pixelRatioMax, shadows, toneMapping, toneMappingExposure, logarithmicDepthBuffer, }: RendererOptions): THREE.WebGLRenderer;
  ```
  - `options` — Canvas plus overrides; see RendererOptions.
  - returns — The configured renderer. Create one per scene and never recreate it
per frame; call `dispose()` on teardown.
- **`createStandardMaterial`** *(function)* — Build a PBR material from a preset name (or raw params), merged with optional.

  ```ts
  function createStandardMaterial(presetOrParams?: StandardPresetName | THREE.MeshStandardMaterialParameters, overrides?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  ```
- **`createToonMaterial`** *(function)* — Cel-shaded `MeshToonMaterial` with a nearest-filtered gradient map of `steps` bands (default 4).

  ```ts
  function createToonMaterial(options?: ToonOptions): THREE.MeshToonMaterial;
  ```
- **`createTppScaffold`** *(function)* — Third-person scaffold: `createApp` with the built-in orbit disabled and a.

  ```ts
  function createTppScaffold<S extends object = Record<string, unknown>>({ state, target, offset, lookAhead, stiffness, rotationStiffness, ...appOptions }: TppScaffoldOptions<S>): TppScaffold<S>;
  ```
  - `options` — State source, chase `target`, local-frame `offset` and
`lookAhead`, damping stiffness, and the remaining `AppOptions`.
  - returns — A TppScaffold with the app and `setTarget`.

  <details><summary>Example</summary>

  ```ts
  const tpp = createTppScaffold({ canvas, target: hero, offset: [0, 4, -8] })
  tpp.app.start()
  ```
  </details>
- **`defineProp`** *(function)* — Validate + tag a prop definition.

  ```ts
  function defineProp(def: PropDefinition): PropFactory;
  ```
- **`displaceByNoise`** *(function)* — Push each vertex along its normal by seeded value noise.

  ```ts
  function displaceByNoise(geo: THREE.BufferGeometry, options?: NoiseDisplaceOptions): THREE.BufferGeometry;
  ```
- **`disposeScene`** *(function)* — Recursively free GPU resources under `root`: every geometry plus every.

  ```ts
  function disposeScene(root: THREE.Object3D): void;
  ```
- **`gearShape`** *(function)* — Gear `Shape` with square-profile `teeth` and a center hole of `innerRadius`.

  ```ts
  function gearShape(teeth: number, outerRadius: number, innerRadius: number, toothDepth?: number): THREE.Shape;
  ```
- **`layoutGrid`** *(function)* — Arrange objects in a centered grid on the `xz` (default) or `xy` plane, mutating their positions.

  ```ts
  function layoutGrid(objects: THREE.Object3D[], options?: GridLayout): THREE.Object3D[];
  ```
- **`pulseScaleClip`** *(function)* — Uniform scale pulse between `min` and `max`.

  ```ts
  function pulseScaleClip(min?: number, max?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`resizeIsoCamera`** *(function)* — Rebuild an iso camera's frustum for a new aspect ratio (and any updated `userData.viewSize`), then update the projection matrix.

  ```ts
  function resizeIsoCamera(camera: THREE.OrthographicCamera, aspect: number): void;
  ```
- **`roundedRectShape`** *(function)* — Rounded rectangle `Shape` centered on the origin; `radius` clamps to half the smaller side.

  ```ts
  function roundedRectShape(width: number, height: number, radius: number): THREE.Shape;
  ```
- **`setupStandardLighting`** *(function)* — The go-to three-part lighting rig: PMREM room environment for IBL, a warm.

  ```ts
  function setupStandardLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options?: StandardLightingOptions): StandardLighting;
  ```
  - `scene` — Scene to light.
  - `renderer` — Renderer for PMREM generation.
  - `options` — Per-part overrides.
  - returns — A StandardLighting handle for tuning and teardown.

  <details><summary>Example</summary>

  ```ts
  const lights = setupStandardLighting(scene, renderer, { sun: { intensity: 2 } })
  ```
  </details>
- **`spinClip`** *(function)* — Continuous 360° rotation around `axis`.

  ```ts
  function spinClip(axis?: 'x' | 'y' | 'z', duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`starShape`** *(function)* — Star `Shape` alternating between `outerRadius` tips and `innerRadius` valleys.

  ```ts
  function starShape(points: number, outerRadius: number, innerRadius: number): THREE.Shape;
  ```
- **`AnimationController`** *(interface)* — Wraps an AnimationMixer + its actions.
- **`Disposable`** *(interface)* — Anything that owns GPU or DOM resources and must be torn down explicitly.
- **`FrameCallback`** *(type)* — Per-frame subscriber invoked with the shared FrameContext.
- **`FrameContext`** *(interface)* — Per-frame context handed to every animated subsystem by the frame loop.
- **`FrameLoop`** *(interface)* — Self-contained Clock-driven frame loop.
- **`InstancePlaceFn`** *(type)* — Per-instance placement callback for instanced props.
- **`LoadedModel`** *(interface)* — Normalized result of loading a model file (glTF and friends).
- **`MaterialPoolLike`** *(interface)* — Minimal structural type for a material pool, so SceneContext can.
- **`ParamSpec`** *(type)* — A parameter specification used to coerce config- or LLM-driven content.
- **`ParamSpecMap`** *(type)* — Named parameter schema: one ParamSpec per parameter key.
- **`ParamValue`** *(type)* — A concrete parameter value after coercion against its ParamSpec.
- **`PlayOptions`** *(interface)* — Playback options for AnimationController.play.
- **`PointerGestureCallbacks`** *(interface)* — Unified pointer gesture callbacks.
- **`PointerGestureOptions`** *(interface)* — Tap-detection tuning for `attachPointerGesture`.
- **`PostEffectName`** *(type)* — Name of a built-in post-processing effect, as listed in a preset's `postFx`.
- **`PropContext`** *(interface)* — Minimal context a prop needs to build + animate itself.
- **`PropDefinition`** *(interface)* — Declarative description of a reusable prop: how to build its Object3D, plus.
- **`PropFactory`** *(type)* — Alias of PropDefinition kept for API symmetry with `defineProp`.
- **`PropInstance`** *(interface)* — A live, mounted prop.
- **`QualityPreset`** *(interface)* — Render budgets for one quality tier.
- **`QualitySettings`** *(interface)* — A resolved QualityPreset tagged with the tier it came from.
- **`QualityTier`** *(type)* — Device performance bucket used to pick a QualityPreset.
- **`SceneContext`** *(interface)* — Context injected into every scene module.
- **`SceneModule`** *(interface)* — A self-contained scene feature.
- **`SeededRng`** *(interface)* — Seeded pseudo-random stream.
- **`WorkerUpdateFn`** *(type)* — Off-thread frame handler run inside a Web Worker by.
- **`WorkerUpdateHandle`** *(interface)* — Handle returned by FrameLoop.registerWorkerUpdate.
- **`WorkerUpdateOptions`** *(interface)* — Options for FrameLoop.registerWorkerUpdate.

  <details><summary>Example</summary>

  ```ts
  import { createApp, raster, primitives } from 'threejs-scenes'
  ```
  </details>

#### `threejs-scenes/core`

The canonical runtime core: the renderer and canvas, the animation-frame loop (including worker-offloaded updates) and injectable clocks, the serializable store, the createApp shell, raw pointer-gesture input, overlay compositing, screen projection, disposal, and device-tier quality detection. Nothing in this layer knows what the scene contains.

- **`attachPointerGesture`** *(function)* — Attach unified drag/pinch/tap/wheel gesture handling to an element.

  ```ts
  function attachPointerGesture(el: HTMLElement, callbacks: PointerGestureCallbacks, { tapThresholdMs, tapMovePx }?: PointerGestureOptions): () => void;
  ```
  - `el` — Element to listen on, typically the render canvas. Its
`touch-action` style is set to `none` to disable native panning/zooming.
  - `callbacks` — Gesture handlers; all optional.
  - `options` — Tap detection thresholds. Defaults: `tapThresholdMs: 250`,
`tapMovePx: 8`.
  - returns — Detach function removing all listeners. The `touch-action` override
is not restored.
- **`attachResizeObserver`** *(function)* — Keep the renderer and camera in sync with the canvas parent's size via a.

  ```ts
  function attachResizeObserver(renderer: THREE.WebGLRenderer, camera: THREE.Camera, canvas: HTMLCanvasElement, onResize?: ResizeHandler): () => void;
  ```
  - returns — Detach function that disconnects the observer.
- **`bootstrapScene`** *(function)* — Bootstrap a minimal animated scene in one call: renderer, scene, perspective.

  ```ts
  function bootstrapScene({ canvas, onSetup }: BootstrapOptions): BootstrappedScene;
  ```
  - `options` — Canvas plus optional setup callback; see BootstrapOptions.
  - returns — A BootstrappedScene exposing the live primitives and `dispose()`.

  <details><summary>Example</summary>

  ```ts
  const { dispose } = bootstrapScene({
    canvas,
    onSetup ({ scene }) {
      const mesh = new THREE.Mesh(geometry, material)
      scene.add(mesh)
      return ({ delta }) => { mesh.rotation.y += delta }
    },
  })
  ```
  </details>
- **`createApp`** *(function)* — Build a complete unidirectional app shell: renderer, scene, camera, seeded.

  ```ts
  function createApp<S extends object = Record<string, unknown>, A = Partial<S>>({ canvas, state, reducer, seed, clock, renderer: rendererOptions, camera: cameraOptions, background, lighting, orbit, modules, onFrame, onResize, render, }: AppOptions<S, A>): App<S, A>;
  ```
  - `options` — App configuration; see AppOptions. Only `canvas` is required.
  - returns — An App handle. `dispose()` stops the loop, detaches gestures
and the resize observer, disposes modules, lights, scene, and renderer.

  <details><summary>Example</summary>

  ```ts
  const app = createApp({
    canvas,
    state: { speed: 1 },
    modules: [ turbineModule ],
    onFrame: (state, frame) => hud.update(state, frame.delta),
  })
  app.start()
  // later: app.setState({ speed: 2 }); app.dispose()
  ```
  </details>
- **`createClock`** *(function)* — Create an injectable simulation time source for the frame loop and.

  ```ts
  function createClock({ mode, step, maxSubSteps }?: ClockOptions): Clock;
  ```
  - `options` — Mode plus fixed-step tuning. Defaults: `mode: 'wall'`,
`step: 1/60`, `maxSubSteps: 5`.
  - returns — A Clock; `reset()` zeroes the accumulator and elapsed total.
- **`createFrameLoop`** *(function)* — Create a frame loop that shares one `requestAnimationFrame` with every other.

  ```ts
  function createFrameLoop({ clock: simClock, fps }?: FrameLoopOptions): FrameLoop;
  ```
  - `options` — Optional sim clock and fps cap; see FrameLoopOptions.
  - returns — A FrameLoop. `dispose()` stops the loop, clears subscribers,
and terminates every worker update it owns.
- **`createOverlayScene`** *(function)* — Create a second scene rendered on top of the main one with the depth buffer.

  ```ts
  function createOverlayScene(camera: THREE.Camera): OverlayHandle;
  ```
  - `camera` — Camera the overlay is rendered through, usually the main scene camera.
  - returns — An OverlayHandle exposing the overlay `scene` and its `pass`.
- **`createRenderer`** *(function)* — Create a `WebGLRenderer` with production defaults: high-performance power.

  ```ts
  function createRenderer({ canvas, antialias, pixelRatioMax, shadows, toneMapping, toneMappingExposure, logarithmicDepthBuffer, }: RendererOptions): THREE.WebGLRenderer;
  ```
  - `options` — Canvas plus overrides; see RendererOptions.
  - returns — The configured renderer. Create one per scene and never recreate it
per frame; call `dispose()` on teardown.
- **`createStore`** *(function)* — Create a minimal store holding serializable app state.

  ```ts
  function createStore<S extends object, A = Partial<S>>(initial: S, reducer?: Reducer<S, A>): Store<S, A>;
  ```
  - `initial` — Starting state. Keep it JSON-serializable (tuples, not
`Vector3`s) so it can be persisted and replayed.
  - `reducer` — Optional Reducer enabling `dispatch`; without one,
`dispatch` throws.
  - returns — A Store.
- **`detectTier`** *(function)* — Detect the device quality tier from cheap navigator/window heuristics.

  ```ts
  function detectTier(): QualityTier;
  ```
- **`disposeMaterial`** *(function)* — Dispose a material and every texture it references.

  ```ts
  function disposeMaterial(mat: THREE.Material): void;
  ```
- **`disposeScene`** *(function)* — Recursively free GPU resources under `root`: every geometry plus every.

  ```ts
  function disposeScene(root: THREE.Object3D): void;
  ```
- **`getQualitySettings`** *(function)* — Resolve the preset for a tier into a QualitySettings object with the.

  ```ts
  function getQualitySettings(tier?: QualityTier): QualitySettings;
  ```
- **`projectToScreenUv`** *(function)* — Project an object's world position to 0..1 screen UV space for effect.

  ```ts
  function projectToScreenUv(object: THREE.Object3D, camera: THREE.Camera, out?: ScreenProjection): ScreenProjection;
  ```
  - `object` — Object whose world position is projected; its world matrix must be current.
  - `camera` — Camera defining the projection.
  - `out` — Optional result object to fill; pass a reused one for zero per-frame allocation.
  - returns — The filled ScreenProjection (the same `out` instance when provided).
- **`renderOverlay`** *(function)* — Composer-free path: call after renderer.render(mainScene, camera).

  ```ts
  function renderOverlay(renderer: THREE.WebGLRenderer, overlayScene: THREE.Scene, camera: THREE.Camera): void;
  ```
- **`QUALITY_PRESETS`** *(const)* — Baseline render budgets per QualityTier: pixel ratio, shadow map.
- **`App`** *(interface)* — Running app shell returned by createApp.
- **`AppCameraOptions`** *(interface)* — Perspective-camera setup for createApp.
- **`AppModule`** *(interface)* — A scene feature in the unidirectional flow.
- **`AppOptions`** *(interface)* — Configuration for createApp.
- **`BootstrapOptions`** *(interface)* — Options for bootstrapScene.
- **`BootstrappedScene`** *(interface)* — Running scene returned by bootstrapScene.
- **`BootstrapSetup`** *(type)* — One-time setup callback for bootstrapScene.
- **`BootstrapSetupContext`** *(interface)* — Scene primitives handed to the BootstrapSetup callback.
- **`Clock`** *(interface)* — A simulation time source.
- **`ClockMode`** *(type)* — Time-advance strategy: `'wall'` passes real deltas through, `'fixed'` emits fixed-size steps.
- **`ClockOptions`** *(interface)* — Options for createClock.
- **`FrameLoopOptions`** *(interface)* — Options for createFrameLoop.
- **`OverlayHandle`** *(interface)* — Handle returned by createOverlayScene.
- **`Reducer`** *(type)* — Pure state transition: returns the next state for an action, never mutates.
- **`RendererOptions`** *(interface)* — Options for createRenderer.
- **`ResizeHandler`** *(type)* — Callback invoked after a resize with the new width and height in CSS pixels.
- **`ScreenProjection`** *(interface)* — Screen-space projection result from projectToScreenUv.
- **`Store`** *(interface)* — Minimal serializable store — the single writer of app state.
- **`StoreListener`** *(type)* — Change subscriber invoked with the new state and the state it replaced.

  <details><summary>Example</summary>

  ```ts
  import { createRenderer, createFrameLoop, createStore } from 'threejs-scenes/core'
  ```
  </details>

#### `threejs-scenes/primitives`

Things you can put in a scene: geometry construction (shapes, extrusion, lathe, tubes), vertex manipulation and merging, materials and procedural textures, seeded noise/scatter, instanced and batched high-count meshes, and voxel storage + meshing. Everything that takes a seed is deterministic.

- **`applyBend`** *(function)* — Bend the geometry into an arc of `angle` radians around its `axis` extent.

  ```ts
  function applyBend(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`applyTaper`** *(function)* — Taper: the two axes perpendicular to `axis` scale from 1 to `factor` along it.

  ```ts
  function applyTaper(geo: THREE.BufferGeometry, factor: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`applyTwist`** *(function)* — Twist around `axis`: rotation grows linearly from 0 to `angle` along the axis.

  ```ts
  function applyTwist(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`createBatchedBuildings`** *(function)* — Batch N different geometries under one shared material into a single.

  ```ts
  function createBatchedBuildings({ geometries, material, transforms, sortObjects, perObjectFrustumCulled, }: BatchedBuildingsOptions): THREE.BatchedMesh;
  ```
  - `options` — Geometries, shared material, and one `Matrix4` per
instance (geometry `i % geometries.length` is used for transform `i`).
  - returns — The `BatchedMesh`; hide individual instances with
`setVisibleAt(id, false)`.
- **`createConnectionGraph`** *(function)* — Connect points into a nearest-neighbor `LineSegments` network — each node.

  ```ts
  function createConnectionGraph(nodes: ReadonlyArray<readonly [number, number, number]>, { neighbors, maxDistance, color, highlightColor, opacity, }?: ConnectionGraphOptions): ConnectionGraph;
  ```
  - `nodes` — Node positions as xyz tuples.
  - `options` — Neighbor count, distance cutoff, colors.
  - returns — A ConnectionGraph; set `progress` from 0 to 1 to animate
edges drawing in.
- **`createExtrudedMesh`** *(function)* — Extrude a 2D profile into a bevelled mesh.

  ```ts
  function createExtrudedMesh(options: ExtrudeOptions): THREE.Mesh;
  ```
  - `options` — Profile, `depth` (default 1), bevel settings (on by
default), and material (default matte standard).
  - returns — The extruded mesh with shadows enabled.

  <details><summary>Example</summary>

  ```ts
  const gear = createExtrudedMesh({ shape: gearShape(12, 2, 1.4), depth: 0.5 })
  ```
  </details>
- **`createGradientToonMap`** *(function)* — Quantized gradient ramp for cel shading — NearestFilter keeps the bands hard.

  ```ts
  function createGradientToonMap(steps?: number): THREE.DataTexture;
  ```
- **`createHolographicMaterial`** *(function)* — Sci-fi hologram `ShaderMaterial`: fresnel rim glow, animated scanlines, and.

  ```ts
  function createHolographicMaterial({ baseColor, fresnelStrength, scanlineDensity, opacity, }?: HolographicMaterialOptions): TickableMaterial;
  ```
  - `options` — Color and effect tuning.
  - returns — A TickableMaterial; call `material.userData.tick(ctx)`
each frame (or register it with the loop) to animate.
- **`createInfiniteGround`** *(function)* — Endless-looking ground from a fixed grid of displaced plane tiles that.

  ```ts
  function createInfiniteGround({ tileSize, gridRadius, segments, displace, material, }?: InfiniteGroundOptions): InfiniteGround;
  ```
  - `options` — `tileSize` (default 32), `gridRadius` (default 2 → 5×5
tiles), per-tile `segments`, a `displace(x, z)` height function, and
material.
  - returns — An InfiniteGround; `heightAt(x, z)` samples the same
displacement used for the mesh.
- **`createInstancedField`** *(function)* — One geometry × N transforms as a single `InstancedMesh` draw call — grass,.

  ```ts
  function createInstancedField({ geometry, material, count, radius, seed, hueBase, hueSpread, scaleMin, scaleMax, place, }: InstancedFieldOptions): THREE.InstancedMesh;
  ```
  - `options` — Geometry, material, `count` (buffers size once), and
placement tuning.
  - returns — The `InstancedMesh` with per-instance colors enabled.
- **`createLatheMesh`** *(function)* — Revolve a 2D profile of `[radius, y]` pairs around the Y axis — vases, columns, chess pieces.

  ```ts
  function createLatheMesh(profile: ReadonlyArray<readonly [number, number] | THREE.Vector2>, options?: LatheOptions): THREE.Mesh;
  ```
- **`createMatcapMaterial`** *(function)* — Matcap material.

  ```ts
  function createMatcapMaterial(matcap?: THREE.Texture | string): THREE.MeshMatcapMaterial;
  ```
- **`createNoise3D`** *(function)* — Seeded 3D simplex noise (classic Gustavson, seed-shuffled permutation.

  ```ts
  function createNoise3D(seed?: number): Noise3D;
  ```
  - `seed` — Any integer; same seed → same field.
  - returns — A Noise3D with `sample`, `fbm`, and `ridged`.
- **`createNoiseTexture`** *(function)* — Seamlessly tileable seeded noise as a `DataTexture` — the noise is sampled.

  ```ts
  function createNoiseTexture({ size, frequency, octaves, seed, channels, }?: NoiseTextureOptions): THREE.DataTexture | null;
  ```
  - `options` — Size (default 256), frequency, octaves, seed, channels.
  - returns — The texture, or `null` in DOM-less runtimes (degrade to flat
colour instead of crashing).
- **`createPathTube`** *(function)* — Sweep a circle through parallel-transport frames along `points`.

  ```ts
  function createPathTube(points: THREE.Vector3[], { radius, radialSegments, inward, vRepeat }?: PathTubeOptions): THREE.BufferGeometry;
  ```
- **`createProceduralBody`** *(function)* — Procedural celestial body: a noise-displaced icosphere terrestrial with.

  ```ts
  function createProceduralBody({ radius, detail, seed, type, displacement, frequency, octaves, ridged, palette, water, clouds, rings, }?: ProceduralBodySpec): ProceduralBody;
  ```
  - `spec` — Body recipe; see ProceduralBodySpec.
  - returns — A ProceduralBody; add `object` to the scene and `tick` it.

  <details><summary>Example</summary>

  ```ts
  const planet = createProceduralBody({ seed: 7, type: 'terrestrial', water: true })
  scene.add(planet.object)
  ```
  </details>
- **`createSeededRng`** *(function)* — Seeded random stream with the fork-per-consumer determinism API: seed.

  ```ts
  function createSeededRng(seed: number): SeededRng;
  ```
  - `seed` — Any integer.
  - returns — A `SeededRng` with `next`/`range`/`int`/`pick`/`fork`.

  <details><summary>Example</summary>

  ```ts
  const rng = createSeededRng(42)
  const grass = rng.fork('grass')   // stable regardless of call order
  ```
  </details>
- **`createShaderQuad`** *(function)* — Fullscreen fragment-shader runner: one fullscreen triangle and a.

  ```ts
  function createShaderQuad({ fragmentShader, uniforms, pointerElement }: ShaderQuadOptions): ShaderQuad;
  ```
  - `options` — Fragment shader, extra uniforms, pointer element.
  - returns — A ShaderQuad: use `render(ctx, renderer)` for shader-only
scenes or `update` + your own composition as a backdrop layer.

  <details><summary>Example</summary>

  ```ts
  const quad = createShaderQuad({ fragmentShader: RAYMARCH_GLSL })
  loop.onFrame(ctx => quad.render(ctx, renderer))
  ```
  </details>
- **`createStandardMaterial`** *(function)* — Build a PBR material from a preset name (or raw params), merged with optional.

  ```ts
  function createStandardMaterial(presetOrParams?: StandardPresetName | THREE.MeshStandardMaterialParameters, overrides?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  ```
- **`createToonMaterial`** *(function)* — Cel-shaded `MeshToonMaterial` with a nearest-filtered gradient map of `steps` bands (default 4).

  ```ts
  function createToonMaterial(options?: ToonOptions): THREE.MeshToonMaterial;
  ```
- **`createTriplanarMaterial`** *(function)* — World-space triplanar grid `ShaderMaterial`: UVs are picked per fragment.

  ```ts
  function createTriplanarMaterial({ palette, tileScale, fogDistance, side, }?: TriplanarMaterialOptions): THREE.ShaderMaterial;
  ```
  - `options` — Palette, tile scale, fog distance, side.
  - returns — The configured `ShaderMaterial`.
- **`displaceByNoise`** *(function)* — Push each vertex along its normal by seeded value noise.

  ```ts
  function displaceByNoise(geo: THREE.BufferGeometry, options?: NoiseDisplaceOptions): THREE.BufferGeometry;
  ```
- **`edgeSplit`** *(function)* — Split shared vertices across hard edges so flat-shaded creases stay sharp.

  ```ts
  function edgeSplit(geo: THREE.BufferGeometry, cutOffAngleRad?: number, keepNormals?: boolean): THREE.BufferGeometry;
  ```
- **`extrudeAlongPath`** *(function)* — Sweep a 2D `shape` along a 3D curve into a mesh — rails, pipes, ribbons.

  ```ts
  function extrudeAlongPath(shape: THREE.Shape, path: THREE.Curve<THREE.Vector3>, options?: ExtrudeAlongPathOptions): THREE.Mesh;
  ```
- **`gearShape`** *(function)* — Gear `Shape` with square-profile `teeth` and a center hole of `innerRadius`.

  ```ts
  function gearShape(teeth: number, outerRadius: number, innerRadius: number, toothDepth?: number): THREE.Shape;
  ```
- **`greedyMesh`** *(function)* — Greedy voxel meshing: merges coplanar same-id faces into maximal.

  ```ts
  function greedyMesh(chunk: VoxelChunk): THREE.BufferGeometry;
  ```
  - `chunk` — The voxel data to mesh.
  - returns — An indexed `BufferGeometry` with normals and per-face vertex
colors derived from voxel ids.
- **`hash2`** *(function)* — Stateless 2D coordinate hash to [0, 1) — cheap lattice noise, no seed state.

  ```ts
  function hash2(x: number, y: number): number;
  ```
- **`hash3`** *(function)* — Stateless 3D coordinate hash to [0, 1).

  ```ts
  function hash3(x: number, y: number, z: number): number;
  ```
- **`lerp`** *(function)* — Linear interpolation from `a` to `b` by `t`.

  ```ts
  function lerp(a: number, b: number, t: number): number;
  ```
- **`mergeGeometryList`** *(function)* — Merge a raw list of geometries (assumed already in a common space).

  ```ts
  function mergeGeometryList(geometries: THREE.BufferGeometry[], useGroups?: boolean): THREE.BufferGeometry;
  ```
- **`mergeMeshes`** *(function)* — Merge `meshes` into a single Mesh when they share one material, or a Group of.

  ```ts
  function mergeMeshes(meshes: THREE.Mesh[]): THREE.Object3D;
  ```
- **`mergeVertices`** *(function)* — Weld duplicate vertices within `tolerance` (indexes the geometry).

  ```ts
  function mergeVertices(geo: THREE.BufferGeometry, tolerance?: number): THREE.BufferGeometry;
  ```
- **`mulberry32`** *(function)* — Tiny fast seeded PRNG: returns a `() => number` yielding uniform values in [0, 1).

  ```ts
  function mulberry32(seed: number): () => number;
  ```
- **`parallelTransportFrames`** *(function)* — Twist-free coordinate frames along a polyline (parallel transport).

  ```ts
  function parallelTransportFrames(points: THREE.Vector3[]): TransportFrames;
  ```
- **`poissonDisk`** *(function)* — Poisson-disk 2D sampling (Bridson): points with a guaranteed minimum.

  ```ts
  function poissonDisk({ width, height, minDist, rng, k, }: PoissonDiskOptions): Point2[];
  ```
  - `options` — Region `width`/`height`, `minDist` spacing, seeded `rng`,
and `k` candidate attempts per sample (default 30).
  - returns — The accepted Point2 samples in [0,width]×[0,height].
- **`polygonShape`** *(function)* — Regular polygon `Shape` with `sides` vertices on a circle of `radius`, first vertex at the top.

  ```ts
  function polygonShape(sides: number, radius: number): THREE.Shape;
  ```
- **`recomputeNormals`** *(function)* — Recompute vertex normals after deforming a geometry — call once after the last modifier.

  ```ts
  function recomputeNormals(geo: THREE.BufferGeometry): THREE.BufferGeometry;
  ```
- **`ringShape`** *(function)* — Annulus `Shape`: a disc of `outerRadius` with an `innerRadius` hole.

  ```ts
  function ringShape(outerRadius: number, innerRadius: number): THREE.Shape;
  ```
- **`roundedRectShape`** *(function)* — Rounded rectangle `Shape` centered on the origin; `radius` clamps to half the smaller side.

  ```ts
  function roundedRectShape(width: number, height: number, radius: number): THREE.Shape;
  ```
- **`simplifyGeometry`** *(function)* — Collapse to roughly `targetCount` vertices via SimplifyModifier.

  ```ts
  function simplifyGeometry(geo: THREE.BufferGeometry, targetCount: number): THREE.BufferGeometry;
  ```
- **`smoothstep`** *(function)* — Hermite smoothstep: 0 below `edge0`, 1 above `edge1`, smooth in between.

  ```ts
  function smoothstep(edge0: number, edge1: number, x: number): number;
  ```
- **`starShape`** *(function)* — Star `Shape` alternating between `outerRadius` tips and `innerRadius` valleys.

  ```ts
  function starShape(points: number, outerRadius: number, innerRadius: number): THREE.Shape;
  ```
- **`tessellateGeometry`** *(function)* — Subdivide long edges.

  ```ts
  function tessellateGeometry(geo: THREE.BufferGeometry, maxEdgeLength?: number, iterations?: number): THREE.BufferGeometry;
  ```
- **`VoxelChunk`** *(class)* — Cubic voxel chunk: flat `Uint16Array` storage with bounds-checked.

  <details><summary>Example</summary>

  ```ts
  const chunk = new VoxelChunk(16)
  chunk.set(0, 0, 0, 1)
  const geometry = greedyMesh(chunk)
  ```
  </details>
- **`MATERIAL_PRESETS`** *(const)* — The tuned `MeshStandardMaterial` parameter sets behind each StandardPresetName.
- **`Axis`** *(type)* — A principal axis name, used by the geometry deformers and layout helpers.
- **`BatchedBuildingsOptions`** *(interface)* — Options for createBatchedBuildings: the geometry variants, ONE shared material, and per-instance transforms.
- **`ConnectionGraph`** *(interface)* — Nearest-neighbor line network.
- **`ConnectionGraphOptions`** *(interface)* — Options for createConnectionGraph: `neighbors` per node, `maxDistance` edge cutoff, and line colors.
- **`ExtrudeAlongPathOptions`** *(interface)* — Options for extrudeAlongPath: sweep `steps`, bevel toggle, curve resolution, and material.
- **`ExtrudeOptions`** *(interface)* — Options for createExtrudedMesh: the 2D profile (`shape` or raw `points`), depth, bevel tuning, and material.
- **`HolographicMaterialOptions`** *(interface)* — Options for createHolographicMaterial: base color, fresnel rim strength, scanline density, and opacity.
- **`InfiniteGround`** *(interface)* — Recentering tiled terrain.
- **`InfiniteGroundOptions`** *(interface)* — Options for createInfiniteGround: tile size/radius/resolution, a `displace` height function, and material.
- **`InstancedFieldOptions`** *(interface)* — Options for createInstancedField: geometry/material/count plus seeded scatter tuning (radius, hue, scale) or a custom `place`.
- **`InstancePlacement`** *(interface)* — Scratch pair handed to a PlaceFn: set the `object` transform and instance `color`.
- **`LatheOptions`** *(interface)* — Options for createLatheMesh: radial `segments`, partial-revolution angles, and material.
- **`Noise3D`** *(interface)* — Seeded 3D simplex noise field with fractal `fbm` and `ridged` sums.
- **`NoiseDisplaceOptions`** *(interface)* — Options for displaceByNoise: amplitude, frequency, and a `seed` or SeededRng for determinism.
- **`NoiseTextureOptions`** *(interface)* — Options for createNoiseTexture: texture `size`, noise frequency/octaves/seed, and which `channels` get independent noise.
- **`PathTubeOptions`** *(interface)* — Options for createPathTube: constant-or-variable `radius`, cross-section resolution, inward normals, and V-repeat.
- **`PlaceFn`** *(type)* — Places instance `index`: mutate `object` position/rotation/scale and `color`; `rng` is the field's seeded stream.
- **`Point2`** *(type)* — An `[x, y]` sample point.
- **`PoissonDiskOptions`** *(interface)* — Options for poissonDisk: region size, minimum spacing, the random stream, and attempts-per-sample `k`.
- **`ProceduralBody`** *(interface)* — A generated celestial body.
- **`ProceduralBodySpec`** *(interface)* — Recipe for createProceduralBody: radius/detail/seed, body `type`, noise displacement tuning, palette, and water/cloud/ring shells.
- **`ShaderQuad`** *(interface)* — A self-contained fullscreen shader scene.
- **`ShaderQuadOptions`** *(interface)* — Options for createShaderQuad: the fragment shader, extra uniforms, and an optional pointer-tracking element.
- **`StandardPresetName`** *(type)* — Built-in PBR preset names for `createStandardMaterial`.
- **`TickableMaterial`** *(interface)* — A `ShaderMaterial` carrying a `userData.tick(ctx)` that advances its time uniform — register it on the frame loop.
- **`ToonOptions`** *(interface)* — Options for createToonMaterial: flat `color` and gradient `steps`.
- **`TransportFrames`** *(interface)* — Per-point tangent/normal/binormal frames along a polyline, twist-free via parallel transport.
- **`TriplanarMaterialOptions`** *(interface)* — Options for createTriplanarMaterial: three-color `palette`, grid `tileScale`, fog distance, and side mode.
- **`VoxelVisitor`** *(type)* — Callback receiving each voxel's coordinates and id during iteration.

  <details><summary>Example</summary>

  ```ts
  import { createExtrudedMesh, VoxelChunk } from 'threejs-scenes/primitives'
  ```
  </details>

#### `threejs-scenes/raster`

How the scene turns into pixels: lighting rigs, cameras, color correction and post-processing chains, and particle emitters (render-technique-bound: billboards, GPGPU, blending). WebGPU/TSL node effects stay off this barrel — import them from /webgpu.

- **`applyEnvironment`** *(function)* — Generate a PMREM environment map and assign it as `scene.environment` for.

  ```ts
  function applyEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { intensity, envScene }?: EnvironmentOptions): THREE.Texture;
  ```
  - `scene` — Scene receiving the environment.
  - `renderer` — Renderer used by the PMREM generator.
  - `options` — Intensity and optional custom environment scene.
  - returns — The environment texture — dispose it when done (the default
environment scene's geometry is freed immediately).
- **`bakeCurve`** *(function)* — Bake a scalar curve into a Float32Array LUT of `resolution` samples.

  ```ts
  function bakeCurve(curve: ScalarCurve, resolution?: number): Float32Array;
  ```
- **`bakeCurveTexture`** *(function)* — Bake color + alpha + size curves into one 2-row RGBA DataTexture:.

  ```ts
  function bakeCurveTexture(color: ColorCurve, alpha: ScalarCurve, size: ScalarCurve, resolution?: number): THREE.DataTexture;
  ```
- **`createBlockDisplacementPass`** *(function)* — Create a ShaderPass that displaces and swaps colour channels in pseudo-random blocks for a datamosh glitch effect.

  ```ts
  function createBlockDisplacementPass(): ShaderPass;
  ```
- **`createCameraController`** *(function)* — Multi-mode camera state machine: `free`, `flyTo`, `follow`, and `cockpit`.

  ```ts
  function createCameraController(camera: THREE.PerspectiveCamera, { stiffness, lookStiffness, fovStiffness, arriveEpsilon, bounds, }?: CameraControllerOptions): CameraController;
  ```
  - `camera` — The perspective camera to drive.
  - `options` — Stiffness, arrival epsilon, and optional bounds.
  - returns — A CameraController; call `update(ctx)` every frame.

  <details><summary>Example</summary>

  ```ts
  const rig = createCameraController(camera, { stiffness: 5 })
  rig.flyTo([0, 12, 30], [0, 0, 0], { onArrive: () => rig.follow(ship) })
  loop.onFrame(ctx => rig.update(ctx))
  ```
  </details>
- **`createCinematicLUT`** *(function)* — Build a cinematic colour-grading 3D LUT as a `Data3DTexture`: a gentle.

  ```ts
  function createCinematicLUT(size?: number, { contrast, splitTone, saturation }?: CinematicLutOptions): THREE.Data3DTexture;
  ```
- **`createComposer`** *(function)* — Create an EffectComposer wired with RenderPass and OutputPass, optionally adding a DepthTexture and UnrealBloomPass.

  ```ts
  function createComposer({ renderer, scene, camera, width, height, withDepth, withBloom, bloomStrength, bloomRadius, bloomThreshold, }: ComposerOptions): ComposerHandle;
  ```
- **`createDofPass`** *(function)* — Create a ShaderPass that applies depth-of-field blur modulated by circle-of-confusion, with radial chromatic separation.

  ```ts
  function createDofPass({ focalDistance, focalRange, maxBlur, caStrength, near, far, }?: DofPassOptions): DofPass;
  ```
- **`createEmitter`** *(function)* — CPU-simulated billboard particle emitter: a fixed-capacity `Points` cloud.

  ```ts
  function createEmitter({ capacity, rate, bursts, lifetime, shape, speed, gravity, damping, size, sizeCurve, color, alphaCurve, rotation, texture, blending, seed, }: EmitterOptions): Emitter;
  ```
  - `options` — Capacity (buffers size once), rate/bursts, lifetime range,
spawn shape, motion, and appearance curves.
  - returns — An Emitter; add `object` to the scene and `tick` it.

  <details><summary>Example</summary>

  ```ts
  const smoke = createEmitter({ capacity: 500, shape: { kind: 'cone', angle: 0.4 } })
  scene.add(smoke.object)
  loop.onFrame(ctx => smoke.tick(ctx))
  ```
  </details>
- **`createFilmGrainPass`** *(function)* — Create a ShaderPass that applies procedural per-fragment film grain with optional luminance-only mode and desaturation.

  ```ts
  function createFilmGrainPass({ intensity, luma, desat, }?: FilmGrainOptions): ShaderPass;
  ```
- **`createFollowCamera`** *(function)* — Chase camera: keeps `offset` in the target's local frame and looks at a.

  ```ts
  function createFollowCamera(camera: THREE.Camera, target: THREE.Object3D, { offset, lookAhead, stiffness, rotationStiffness, }: FollowCameraOptions): CameraController;
  ```
  - `camera` — Camera to move.
  - `target` — Object to chase; swap via the returned controller's `follow`.
  - `options` — Offset (required), look-ahead, and stiffness tuning.
  - returns — A `CameraController` locked to follow mode; call `update(ctx)`
every frame.
- **`createGodRaysPass`** *(function)* — Create a GodRaysPass that ray-marches from each fragment toward the light's screen-space position, accumulating scattered brightness (GPU Gems 3 ch.13 algorithm).

  ```ts
  function createGodRaysPass(): GodRaysPass;
  ```
- **`createGpuEmitter`** *(function)* — GPGPU particle emitter: position and velocity live in float textures.

  ```ts
  function createGpuEmitter(renderer: THREE.WebGLRenderer, options: GpuEmitterOptions): Emitter;
  ```
  - `renderer` — Renderer running the compute passes (WebGL2).
  - `options` — Same appearance/motion contract as the CPU emitter.
  - returns — An Emitter; `burst`/`setRate` are no-ops — particles
respawn continuously as their lifetime wraps.
- **`createGradePass`** *(function)* — Create a ShaderPass that applies tint, contrast, saturation, vignette, seeded grain, and radial chromatic aberration in linear HDR.

  ```ts
  function createGradePass({ tint, contrast, saturation, vignette, grain, chromatic, }?: GradePassOptions): GradePass;
  ```
- **`createHemisphereFill`** *(function)* — Soft ambient fill: a `HemisphereLight` blending sky and ground bounce colors (defaults: cool sky, warm earth, 0.4).

  ```ts
  function createHemisphereFill({ skyColor, groundColor, intensity, }?: HemisphereFillOptions): THREE.HemisphereLight;
  ```
- **`createHudBeamTransition`** *(function)* — Create a horizontal beam-sweep transition that reveals content with RGB-split fringes.

  ```ts
  function createHudBeamTransition({ duration, beamWidth, beamColor, onComplete, }?: HudBeamOptions): HudBeamTransition;
  ```
- **`createIsoCamera`** *(function)* — Orthographic isometric camera: positioned on a 45°-yaw tilted orbit and.

  ```ts
  function createIsoCamera(aspect: number, { viewSize, flavor, near, far, }?: IsoCameraOptions): THREE.OrthographicCamera;
  ```
  - `aspect` — Viewport width / height.
  - `options` — View size, flavor, near/far planes.
  - returns — A configured `OrthographicCamera` looking at the origin.
- **`createLightCone`** *(function)* — Fake volumetric light shaft: an open additive-blended cone from `from` to.

  ```ts
  function createLightCone(from: THREE.Vector3, to: THREE.Vector3, { color, spread }?: LightConeOptions): THREE.Mesh;
  ```
  - `from` — Apex (the light source position).
  - `to` — Where the beam lands; sets length and orientation.
  - `options` — Color and spread.
  - returns — The cone mesh; dispose its geometry/material when done.
- **`createLightingRig`** *(function)* — Preset-driven stage rig: hemisphere + key + rim + accent + spot lights and.

  ```ts
  function createLightingRig(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { preset, shadows, presets }?: LightingRigOptions): LightingRig;
  ```
  - `scene` — Scene the rig lights.
  - `renderer` — Renderer whose `toneMappingExposure` presets control.
  - `options` — Initial preset, shadow toggle, and extra presets.
  - returns — A LightingRig.

  <details><summary>Example</summary>

  ```ts
  const rig = createLightingRig(scene, renderer, { preset: 'neon' })
  rig.setPreset('dramatic')
  ```
  </details>
- **`createPathCamera`** *(function)* — Rail-riding camera: advances `distance` along the source curve at `speed`,.

  ```ts
  function createPathCamera(camera: THREE.PerspectiveCamera, path: PathCameraSource, element: HTMLElement, { yawRange, pitchRange, smoothing, speed }?: PathCameraOptions): PathCamera;
  ```
  - `camera` — Perspective camera to drive.
  - `source` — Curve + total length; may be swapped between frames
(segment streams rebuild it as segments append).
  - `element` — Element whose pointer movement drives look-around.
  - `options` — Ranges, smoothing, and speed.
  - returns — A PathCamera; call `update(ctx)` once per frame.
- **`createPostPipeline`** *(function)* — Create a PostPipeline with a named-pass registry.

  ```ts
  function createPostPipeline({ renderer, scene, camera, width, height, withDepth, }: PostPipelineOptions): PostPipeline;
  ```
- **`createRgbShiftPass`** *(function)* — Create a ShaderPass that separates RGB channels along a configurable angle for a chromatic glitch effect.

  ```ts
  function createRgbShiftPass(): ShaderPass;
  ```
- **`createScanCorruptionPass`** *(function)* — Create a ShaderPass that adds horizontal scan-line jitter and brightness spikes for a corrupt-signal glitch effect.

  ```ts
  function createScanCorruptionPass(): ShaderPass;
  ```
- **`createStereoRenderer`** *(function)* — Create a StereoRenderer for the given mode.

  ```ts
  function createStereoRenderer(renderer: THREE.WebGLRenderer, mode: StereoMode, { width, height }?: StereoSizeOptions): StereoRenderer;
  ```
- **`createSun`** *(function)* — Warm shadow-casting `DirectionalLight` with a sensibly-sized orthographic.

  ```ts
  function createSun({ color, intensity, position, shadowMapSize, shadowFrustum, shadowFar, }?: SunOptions): THREE.DirectionalLight;
  ```
  - `options` — Color (default warm white), intensity (default 3),
position, and shadow tuning.
  - returns — The configured light; add both it and `light.target` to the scene.
- **`resizeIsoCamera`** *(function)* — Rebuild an iso camera's frustum for a new aspect ratio (and any updated `userData.viewSize`), then update the projection matrix.

  ```ts
  function resizeIsoCamera(camera: THREE.OrthographicCamera, aspect: number): void;
  ```
- **`sampleCurve`** *(function)* — Sample a scalar curve at t.

  ```ts
  function sampleCurve(curve: ScalarCurve, t: number): number;
  ```
- **`sampleShape`** *(function)* — Sample a spawn position + emission direction from an emitter shape.

  ```ts
  function sampleShape(shape: EmitterShape, r: () => number, out: SpawnSample): void;
  ```
- **`setupStandardLighting`** *(function)* — The go-to three-part lighting rig: PMREM room environment for IBL, a warm.

  ```ts
  function setupStandardLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options?: StandardLightingOptions): StandardLighting;
  ```
  - `scene` — Scene to light.
  - `renderer` — Renderer for PMREM generation.
  - `options` — Per-part overrides.
  - returns — A StandardLighting handle for tuning and teardown.

  <details><summary>Example</summary>

  ```ts
  const lights = setupStandardLighting(scene, renderer, { sun: { intensity: 2 } })
  ```
  </details>
- **`targetFromObject`** *(function)* — Frame an object: stand `distance` away along `direction`, look at its center.

  ```ts
  function targetFromObject(object: THREE.Object3D, distance: number, direction?: Vec3Tuple): CameraTarget;
  ```
- **`tupleToVector3`** *(function)* — Copy a Vec3Tuple into a `Vector3`, reusing `out` when given (zero-alloc pattern).

  ```ts
  function tupleToVector3(tuple: Vec3Tuple, out?: THREE.Vector3): THREE.Vector3;
  ```
- **`vector3ToTuple`** *(function)* — Snapshot a `Vector3` as a serializable Vec3Tuple.

  ```ts
  function vector3ToTuple(v: THREE.Vector3): Vec3Tuple;
  ```
- **`GradeShader`** *(const)* — Raw ShaderPass shader definition for colour grading: tint, contrast, saturation, vignette, grain, and radial chromatic aberration.
- **`LIGHTING_PRESETS`** *(const)* — The five built-in looks — `dramatic`, `studio`, `soft`, `neon`, `sunset` — as data, mergeable with custom presets via LightingRigOptions.presets.
- **`CameraBounds`** *(interface)* — Axis-aligned box the camera position is clamped into.
- **`CameraController`** *(interface)* — Multi-mode camera state machine driven by `update(ctx)` once per frame.
- **`CameraControllerOptions`** *(interface)* — Tuning for createCameraController: easing stiffnesses, fly-to arrival radius, and position bounds.
- **`CameraMode`** *(type)* — Which behavior currently drives the camera: idle, easing to a target, tracking an object, or anchored to a rig.
- **`CameraTarget`** *(interface)* — A serializable camera intent: where to stand and what to look at.
- **`CinematicLutOptions`** *(interface)* — Options for createCinematicLUT.
- **`ColorCurve`** *(type)* — [t, color] stops; color as css string or [r,g,b] in 0..1.
- **`ComposerHandle`** *(interface)* — Handle returned by createComposer, exposing the EffectComposer and helper methods.
- **`ComposerOptions`** *(interface)* — Options for createComposer.
- **`DofPass`** *(interface)* — Combined depth-of-field and chromatic-aberration pass.
- **`DofPassOptions`** *(interface)* — Options for createDofPass.
- **`Emitter`** *(interface)* — A live particle system.
- **`EmitterOptions`** *(interface)* — Options for createEmitter and createGpuEmitter: capacity, emission rate/bursts, lifetime, shape, motion, and appearance curves.
- **`EmitterShape`** *(type)* — Spawn volume for particles: `point`, `sphere` (optionally shell-only), `box`, `cone` (angle in radians), or `disc`.
- **`EnvironmentOptions`** *(interface)* — Options for applyEnvironment: IBL `intensity` and an optional custom environment scene.
- **`FilmGrainOptions`** *(interface)* — Options for createFilmGrainPass.
- **`FlyToOptions`** *(interface)* — Per-flight options for CameraController.flyTo: speed scale, target `fov`, and an arrival callback.
- **`FollowCameraOptions`** *(interface)* — Options for createFollowCamera: required local-frame `offset`, look-ahead point, and position/rotation damping stiffness.
- **`GodRaysPass`** *(interface)* — Volumetric light-shaft pass with per-frame world-space light tracking and optional occlusion buffer.
- **`GpuEmitterOptions`** *(type)* — Options for createGpuEmitter — `EmitterOptions` minus the CPU-only rate/burst controls (GPU particles recycle continuously).
- **`GradePass`** *(interface)* — Colour-grade pass with a setTime() method to animate seeded grain.
- **`GradePassOptions`** *(interface)* — Options for createGradePass.
- **`HemisphereFillOptions`** *(interface)* — Options for createHemisphereFill: sky/ground colors and intensity.
- **`HudBeamOptions`** *(interface)* — Options for createHudBeamTransition.
- **`HudBeamTransition`** *(interface)* — Handle returned by createHudBeamTransition with play/tick controls.
- **`IsoCameraOptions`** *(interface)* — Options for createIsoCamera: vertical `viewSize` in world units, projection `flavor`, and near/far planes.
- **`IsoFlavor`** *(type)* — Iso projection flavor: `true-iso` tilts atan(1/√2) ≈ 35.26°, `dimetric` uses the game-friendly 30°.
- **`LightConeOptions`** *(interface)* — Options for createLightCone: beam color and base-radius `spread`.
- **`LightingConfig`** *(interface)* — One complete lighting look: background/exposure/fog plus hemi, key, rim, and accent light tuples, with optional spot and beams.
- **`LightingPresetName`** *(type)* — Built-in look names for createLightingRig.
- **`LightingRig`** *(interface)* — A live preset-switchable rig.
- **`LightingRigOptions`** *(interface)* — Options for createLightingRig.
- **`PathCamera`** *(interface)* — Handle returned by createPathCamera.
- **`PathCameraOptions`** *(interface)* — Tuning for createPathCamera: look-around ranges (radians), look smoothing, and travel speed.
- **`PathCameraSource`** *(interface)* — What a path camera rides: a curve plus its total length.
- **`PostPipeline`** *(interface)* — Reorderable named-pass pipeline over EffectComposer.
- **`PostPipelineOptions`** *(interface)* — Options for createPostPipeline.
- **`ScalarCurve`** *(type)* — [t, value] stops, t in 0..1 ascending.
- **`SpawnSample`** *(interface)* — One sampled spawn: position (`px..pz`) and emission direction (`dx..dz`).
- **`StandardLighting`** *(interface)* — The standard rig's parts.
- **`StandardLightingOptions`** *(interface)* — Options for setupStandardLighting, grouping the environment, sun, and hemisphere sub-options.
- **`StereoMode`** *(type)* — Render mode for stereoscopic 3D: anaglyph (red/cyan), side-by-side stereo, or off (passthrough).
- **`StereoRenderer`** *(interface)* — Renderer wrapper for anaglyph or side-by-side stereo output.
- **`StereoSizeOptions`** *(interface)* — Optional size override for the stereo effect render target.
- **`SunOptions`** *(interface)* — Options for createSun: color, intensity, position, and shadow map/frustum sizing.
- **`Vec3Tuple`** *(type)* — A serializable xyz triple — the state-friendly form of a `Vector3`.

  <details><summary>Example</summary>

  ```ts
  import { createBloomPass, createCameraController } from 'threejs-scenes/raster'
  ```
  </details>

#### `threejs-scenes/compose`

Assembling and interacting with a scene: scene modules and view management, props and model loading, grouping/layout, animation, skyboxing, raycasting and declarative event binding. It decides WHAT is in the scene and how it responds, never how pixels are produced.

- **`bindSceneEvents`** *(function)* — Declarative raycast event binding: attach tap/down/up/enter/leave handlers.

  ```ts
  function bindSceneEvents({ element, camera, bindings, correctPointer, }: SceneEventsOptions): SceneEvents;
  ```
  - `options` — Element, camera, initial bindings, and optional
`correctPointer` distortion inverse (needed under warping post passes).
  - returns — A SceneEvents registry.
- **`bobClip`** *(function)* — Vertical bob (sine, seamless loop).

  ```ts
  function bobClip(amp?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`clearModelCache`** *(function)* — Empty the shared module-global model cache used by loadModel.

  ```ts
  function clearModelCache(): void;
  ```
- **`clipFromTracks`** *(function)* — Assemble tracks into a named `AnimationClip` of the given `duration` in seconds.

  ```ts
  function clipFromTracks(name: string, duration: number, tracks: THREE.KeyframeTrack[]): THREE.AnimationClip;
  ```
- **`combineClips`** *(function)* — Merge several clips into one, layering all their tracks.

  ```ts
  function combineClips(name: string, clips: THREE.AnimationClip[]): THREE.AnimationClip;
  ```
  - `name` — Name of the combined clip.
  - `clips` — Clips whose tracks are concatenated; tracks targeting the
same property will fight — combine complementary clips (spin + bob).
  - returns — One `AnimationClip` playing every input in parallel.
- **`createAnimationController`** *(function)* — Wrap an `AnimationMixer` and its actions with `play`/`crossfade`/`stop` and.

  ```ts
  function createAnimationController(root: THREE.Object3D, clips?: THREE.AnimationClip[], loop?: FrameLoop): AnimationController;
  ```
  - `root` — Object the mixer binds to (the .glb scene or a procedural prop).
  - `clips` — Clips to expose as named actions.
  - `loop` — When given, `tick` auto-registers via `registerUpdate`.
  - returns — An `AnimationController`. `dispose()` unregisters the tick, stops
all actions, and uncaches the root so nothing leaks.

  <details><summary>Example</summary>

  ```ts
  const anim = createAnimationController(model.scene, model.animations, ctx.loop)
  anim.play('walk', { fadeIn: 0.3 })
  ```
  </details>
- **`createChunkManager`** *(function)* — Infinite-world chunk manager: keeps a `viewRadius` ring of chunks built.

  ```ts
  function createChunkManager({ chunkSize, viewRadius, rebaseThreshold, build, }: ChunkManagerOptions): ChunkManager;
  ```
  - `options` — Chunk size, view radius, rebase threshold (default 4096),
and the chunk `build` callback.
  - returns — A ChunkManager; add `root` to the scene.
- **`createClickGuard`** *(function)* — Click-vs-drag discrimination: call `down(x, y)` on pointerdown and.

  ```ts
  function createClickGuard(thresholdPx?: number): CreateClickGuardReturnType;
  ```
  - `thresholdPx` — Max travel in CSS pixels still counted as a click.
  - returns — A `{ down, isClick }` pair.
- **`createGLTFLoader`** *(function)* — Build a `GLTFLoader` with optional DRACO, KTX2, and Meshopt decoders.

  ```ts
  function createGLTFLoader(options?: GLTFLoaderOptions): GLTFLoader;
  ```
  - `options` — Which decoders to wire and where their binaries live.
  - returns — A configured `GLTFLoader`.
- **`createGroup`** *(function)* — Group `children` under one `Group` with an optional Transform applied.

  ```ts
  function createGroup(children?: THREE.Object3D[], transform?: Transform): THREE.Group;
  ```
- **`createInstancedProp`** *(function)* — Scatter one prop as an `InstancedMesh` field: builds a single sample from.

  ```ts
  function createInstancedProp(factory: PropFactory, options: InstancedPropOptions, ctx?: PropContext): InstancedPropResult;
  ```
  - `factory` — Prop definition; its `instanced` hint merges under `options`.
  - `options` — Count/radius/seed/placement overrides.
  - `ctx` — Prop context (rng, loop).
  - returns — An InstancedPropResult ready to add to the scene.
- **`createModelCache`** *(function)* — Create an owned, URL-keyed model cache.

  ```ts
  function createModelCache(): ModelCache;
  ```
  - returns — A ModelCache; `clear()` empties the cache.
- **`createProceduralTexture`** *(function)* — Fetch-or-paint a texture from the shared module-global cache.

  ```ts
  function createProceduralTexture(key: string, paint: PaintFn, size?: number): THREE.CanvasTexture | null;
  ```
- **`createProp`** *(function)* — Mount a prop definition: build its object, attach declared lights, and wire.

  ```ts
  function createProp(factory: PropFactory, ctx?: PropContext, options?: CreatePropOptions): PropInstance;
  ```
  - `factory` — The prop definition (author with `defineProp`).
  - `ctx` — Prop context; pass `loop` so clips advance with the frame loop.
  - `options` — Set `autoplay: false` to leave clips stopped.
  - returns — A `PropInstance`; `dispose()` frees the controller and everything
the prop built.
- **`createPropComposite`** *(function)* — Assemble several mounted props into one `Group`, applying each part's.

  ```ts
  function createPropComposite(parts: CompositePart[]): PropComposite;
  ```
  - `parts` — Props with optional local transforms.
  - returns — A PropComposite whose `object` is ready to add to the scene.
- **`createPropRegistry`** *(function)* — Create an owned prop registry.

  ```ts
  function createPropRegistry(): PropRegistry;
  ```
  - returns — A PropRegistry.
- **`createSceneModule`** *(function)* — Wrap a build function into a lifecycle-safe `SceneModule`.

  ```ts
  function createSceneModule(def: SceneModuleDefinition): SceneModule;
  ```
  - `def` — Module name and build function.
  - returns — A `SceneModule` whose `dispose()` frees only what the module
created — never shared or pooled resources.

  <details><summary>Example</summary>

  ```ts
  const stars = createSceneModule({
    name: 'stars',
    build (ctx, registerUpdate) {
      const field = makeStarfield(ctx.rng)
      ctx.scene.add(field)
      registerUpdate(({ delta }) => field.rotation.y += delta * 0.01)
      return () => { ctx.scene.remove(field); field.geometry.dispose() }
    },
  })
  ```
  </details>
- **`createSkybox`** *(function)* — Set the scene background: a flat color, a procedural vertical-gradient.

  ```ts
  function createSkybox(scene: THREE.Scene, { color, gradient, equirect, cube, environment, radius, }: SkyboxOptions): Skybox;
  ```
  - `scene` — Scene whose background (and optionally environment) is set.
  - `options` — The sky mode plus `environment` and dome `radius`.
  - returns — A Skybox; `object` is the gradient dome mesh when that
mode is active.

  <details><summary>Example</summary>

  ```ts
  const sky = createSkybox(scene, { gradient: { top: '#79f7ff', bottom: '#0a0a14' } })
  ```
  </details>
- **`createTextureCache`** *(function)* — Create an owned procedural-texture cache.

  ```ts
  function createTextureCache(): TextureCache;
  ```
  - returns — A TextureCache; `get` returns `null` in DOM-less runtimes
so headless code degrades to flat colour instead of crashing.
- **`createViewRegistry`** *(function)* — Pluggable per-view renderers with an LRU persistent-mount cache: switching.

  ```ts
  function createViewRegistry<S = unknown>({ create, limit }: ViewRegistryOptions<S>): ViewRegistry<S>;
  ```
  - `options` — Renderer factory and cache limit.
  - returns — A ViewRegistry keyed by view name.
- **`defineProp`** *(function)* — Validate + tag a prop definition.

  ```ts
  function defineProp(def: PropDefinition): PropFactory;
  ```
- **`EditStack`** *(class)* — Snapshot-based undo/redo stack.

  <details><summary>Example</summary>

  ```ts
  const edits = new EditStack(initialLayout)
  edits.push(nextLayout)
  const restored = edits.undo()
  ```
  </details>
- **`getProp`** *(function)* — Look up a prop factory by name in the shared module-global registry.

  ```ts
  function getProp(name: string): PropFactory | undefined;
  ```
- **`groupBounds`** *(function)* — World-space bounding box of an object and all its descendants.

  ```ts
  function groupBounds(obj: THREE.Object3D): THREE.Box3;
  ```
- **`layoutGrid`** *(function)* — Arrange objects in a centered grid on the `xz` (default) or `xy` plane, mutating their positions.

  ```ts
  function layoutGrid(objects: THREE.Object3D[], options?: GridLayout): THREE.Object3D[];
  ```
- **`layoutRadial`** *(function)* — Arrange objects evenly around a circle in the ground plane, optionally facing the center.

  ```ts
  function layoutRadial(objects: THREE.Object3D[], options?: RadialLayout): THREE.Object3D[];
  ```
- **`layoutStack`** *(function)* — Stack objects along `axis` at `spacing` intervals, centered on the origin.

  ```ts
  function layoutStack(objects: THREE.Object3D[], axis?: Axis, spacing?: number): THREE.Object3D[];
  ```
- **`loadGLTF`** *(function)* — Load a `.glb`/`.gltf` file into the normalized `LoadedModel` shape.

  ```ts
  function loadGLTF(url: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
  ```
  - `url` — Model URL.
  - `options` — Decoder wiring when the asset is compressed.
  - returns — Scene root, animation clips, cameras, and the asset metadata.
- **`loadModel`** *(function)* — Load a model through the shared module-global cache.

  ```ts
  function loadModel(src: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
  ```
- **`MaterialPool`** *(class)* — Keyed material cache: `get(key, factory)` returns the cached material or.
- **`numberTrack`** *(function)* — Build a `NumberKeyframeTrack` for `targetPath` (one value per keyframe time).

  ```ts
  function numberTrack(targetPath: string, times: number[], values: number[]): THREE.NumberKeyframeTrack;
  ```
- **`pick`** *(function)* — pickTopLevel with a distortion hook + object scoping.

  ```ts
  function pick(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, { isPickable, distortion, objects }?: PickOptions): PickResult | null;
  ```
- **`pickTopLevel`** *(function)* — Raycast from NDC pointer coordinates and walk the first accepted hit up to.

  ```ts
  function pickTopLevel(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, isPickable?: PickFilter): PickResult | null;
  ```
  - `scene` — Scene whose children are cast against (recursive).
  - `camera` — Camera defining the pick ray.
  - `ndcX` — Pointer X in normalized device coordinates [-1, 1].
  - `ndcY` — Pointer Y in normalized device coordinates [-1, 1].
  - `isPickable` — Optional filter; rejected hits fall through to the next.
  - returns — The first accepted PickResult, or `null` when nothing hit.
- **`pulseScaleClip`** *(function)* — Uniform scale pulse between `min` and `max`.

  ```ts
  function pulseScaleClip(min?: number, max?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`quaternionTrack`** *(function)* — Build a `QuaternionKeyframeTrack` for `targetPath` (four values per keyframe time, slerped).

  ```ts
  function quaternionTrack(targetPath: string, times: number[], values: number[]): THREE.QuaternionKeyframeTrack;
  ```
- **`registerProp`** *(function)* — Register a prop factory under a name in the shared module-global registry.

  ```ts
  function registerProp(name: string, factory: PropFactory): void;
  ```
- **`resolveParam`** *(function)* — Coerce one value against its `ParamSpec` — clamp numbers into [min, max],.

  ```ts
  function resolveParam(spec: ParamSpec, given: unknown): ParamValue;
  ```
  - `spec` — The parameter contract.
  - `given` — Untrusted input (config file, LLM-emitted JSON).
  - returns — A valid `ParamValue` satisfying the spec.
- **`resolveParams`** *(function)* — Coerce a whole params object against a `ParamSpecMap` via resolveParam — one pass, never throws, unknown keys ignored.

  ```ts
  function resolveParams(specs: ParamSpecMap, given?: Record<string, unknown>): Record<string, ParamValue>;
  ```
- **`resolveProp`** *(function)* — Resolve any prop source to a mounted `PropInstance` via the shared.

  ```ts
  function resolveProp(src: PropFactory | string, ctx?: PropContext): Promise<PropInstance>;
  ```
  - `src` — Factory, registered name, model URL, or module path.
  - `ctx` — Prop context; pass `loop` so model clips animate.
  - returns — The mounted prop.
- **`spinClip`** *(function)* — Continuous 360° rotation around `axis`.

  ```ts
  function spinClip(axis?: 'x' | 'y' | 'z', duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`trackFromKeyframes`** *(function)* — Build the matching `KeyframeTrack` subclass from a TrackSpec.

  ```ts
  function trackFromKeyframes(spec: TrackSpec): THREE.KeyframeTrack;
  ```
- **`vectorTrack`** *(function)* — Build a `VectorKeyframeTrack` for `targetPath` (three values per keyframe time).

  ```ts
  function vectorTrack(targetPath: string, times: number[], values: number[]): THREE.VectorKeyframeTrack;
  ```
- **`FORMAT_LOADERS`** *(const)* — File-extension → loader dispatch table.
- **`proceduralTextureCache`** *(const)* — Disposer for the shared module-global texture cache used by createProceduralTexture.
- **`ChunkBuilder`** *(type)* — Populates chunk `(cx, cz)` by adding content to the pooled `Group`; may be async (chunk streaming).
- **`ChunkManager`** *(interface)* — Infinite-world chunk streamer.
- **`ChunkManagerOptions`** *(interface)* — Options for createChunkManager: chunk size, view radius in chunks, origin-rebase threshold, and the `build` callback.
- **`CompositePart`** *(interface)* — One prop's placement inside a createPropComposite group: local position, Euler rotation, and uniform or per-axis scale.
- **`CreatePropOptions`** *(interface)* — Mount options for createProp.
- **`GLTFLoaderOptions`** *(interface)* — Decoder/transcoder wiring for createGLTFLoader: DRACO, KTX2, and Meshopt support.
- **`GradientSkyOptions`** *(interface)* — Two-color vertical gradient for the procedural sky dome.
- **`GridLayout`** *(interface)* — Options for layoutGrid: column count (default √n), `spacing`, and layout plane.
- **`InstancedPropOptions`** *(interface)* — Placement options for createInstancedProp: instance `count`, scatter `radius`, deterministic `seed`, and a custom `place` callback.
- **`InstancedPropResult`** *(interface)* — The instanced field.
- **`ModelCache`** *(interface)* — An owned model cache — prefer this over the module-global loadModel so lifetime and invalidation are yours.
- **`ModelLoader`** *(type)* — Loads one model format into the normalized `LoadedModel` shape.
- **`PaintFn`** *(type)* — Paints one procedural texture onto a square 2D canvas of `size` pixels.
- **`PickFilter`** *(type)* — Predicate limiting which objects a raycast pick may hit.
- **`PickOptions`** *(interface)* — Options for pick: hit filter, screen-distortion inverse, and cast-root scoping.
- **`PickResult`** *(interface)* — A raycast hit: the leaf `object`, its `topLevel` scene-direct-child ancestor, world `point`, and ray `distance`.
- **`PropComposite`** *(interface)* — A group of placed prop instances.
- **`PropRegistry`** *(interface)* — An owned name → prop-factory registry — prefer this over the module-global registerProp/resolveProp pair so name resolution is scoped to your app.
- **`RadialLayout`** *(interface)* — Options for layoutRadial: circle `radius`, `startAngle`, and whether items rotate to face the center.
- **`SceneEventBinding`** *(interface)* — One object's event subscription for bindSceneEvents.
- **`SceneEventHandlers`** *(interface)* — Per-object pointer handlers: tap, down/up, and hover enter/leave.
- **`SceneEvents`** *(interface)* — Handle returned by bindSceneEvents.
- **`SceneEventsOptions`** *(interface)* — Options for bindSceneEvents: the DOM element, camera, initial bindings, and an optional pointer-distortion inverse.
- **`SceneModuleDefinition`** *(interface)* — Definition consumed by createSceneModule: a `name` plus `build(ctx, registerUpdate)` which may return a teardown function.
- **`Skybox`** *(interface)* — Handle returned by createSkybox.
- **`SkyboxOptions`** *(interface)* — Options for createSkybox — set exactly one of `color`, `gradient`, `equirect`, or `cube`.
- **`TextureCache`** *(interface)* — An owned, keyed `CanvasTexture` cache — prefer this over the module-global createProceduralTexture so texture lifetime follows your scene.
- **`TrackSpec`** *(interface)* — Declarative keyframe-track description consumed by trackFromKeyframes.
- **`Transform`** *(interface)* — Optional position/Euler-rotation/scale applied when grouping or placing objects.
- **`ViewRegistry`** *(interface)* — LRU registry of ViewRenderers.
- **`ViewRegistryOptions`** *(interface)* — Options for createViewRegistry: the `create` factory plus the LRU `limit`.
- **`ViewRenderer`** *(interface)* — One "view" of the app (a whole sub-scene).

  <details><summary>Example</summary>

  ```ts
  import { createSkybox, createPropRegistry } from 'threejs-scenes/compose'
  ```
  </details>

#### `threejs-scenes/state`

Unidirectional data flow as a first-class layer: the controller protocol (any { get, subscribe } is a valid state source; plain objects are wrapped) and tween/lerp transition helpers so state changes animate instead of snapping. The serializable store itself lives in /core. State flows one way — nothing writes back.

- **`bindStateSource`** *(function)* — Keep an app's state following an external controller.

  ```ts
  function bindStateSource<S extends object>(target: TargetType<S>, source: StateSource<S> | undefined): () => void;
  ```
  - `app` — Anything with a `setState(partial)` method.
  - `source` — The state source the scaffold was given.
  - returns — A detach function that unsubscribes the mirror.
- **`isStateController`** *(function)* — Type guard: `true` when `source` is a `{ get, subscribe }` controller rather than a plain state object.

  ```ts
  function isStateController<S extends object>(source: StateSource<S> | undefined): source is StateController<S>;
  ```
- **`lerpOnChange`** *(function)* — Apply-on-animate: like tweened, but pushes each interpolated value.

  ```ts
  function lerpOnChange<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, apply: (value: V) => void, options?: TweenOptions): Disposable & {
  ```
- **`resolveInitialState`** *(function)* — Mirror an external controller into an app: seed with `resolveInitialState`,.

  ```ts
  function resolveInitialState<S extends object>(source: StateSource<S> | undefined, fallback: S): S;
  ```
- **`toController`** *(function)* — Normalize any state source to a controller.

  ```ts
  function toController<S extends object>(source: StateSource<S>): StateController<S>;
  ```
- **`tweened`** *(function)* — Follow a numeric selection of controller state, easing every change.

  ```ts
  function tweened<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, { duration, easing, stiffness }?: TweenOptions): Tweened<V>;
  ```
- **`EASINGS`** *(const)* — Built-in easing curves: `linear`, `easeIn`, `easeOut`, `easeInOut` (quadratic), and `cubicOut`.
- **`Easing`** *(type)* — Easing curve: maps normalized progress `t` in [0, 1] to an eased ratio.
- **`StateController`** *(interface)* — Read side of a store: the minimal contract scaffolds consume state through.
- **`StateSource`** *(type)* — What a scaffold accepts as its state input.
- **`Tweened`** *(interface)* — A live tweened value driven by store commits.
- **`TweenOptions`** *(interface)* — Timing options for tweened and lerpOnChange: timed easing or continuous exp-damping.
- **`TweenValue`** *(type)* — Scalars and fixed-length numeric tuples — positions, scales, rgb colors.

  <details><summary>Example</summary>

  ```ts
  import { toController, tweened } from 'threejs-scenes/state'
  ```
  </details>

#### `threejs-scenes/scaffold`

Genre-level wiring in one call. Each scaffold accepts a plain object, a store, or a { get, subscribe } controller as its state source, wraps the shared createApp runtime (createApp itself lives in /core), and returns the app plus its genre-specific handles: iso, orbit, tpp, rails, fps.

- **`createFpsScaffold`** *(function)* — First-person scaffold: pointer-lock mouse look plus WASD/arrow movement.

  ```ts
  function createFpsScaffold<S extends object = Record<string, unknown>>({ state, speed, lookSpeed, eyeHeight, pointerLock, collide, groundHeight, ...appOptions }: FpsScaffoldOptions<S>): FpsScaffold<S>;
  ```
  - `options` — State source, `speed`/`lookSpeed`/`eyeHeight`,
`pointerLock` toggle, `collide` and `groundHeight` hooks, and the remaining
`AppOptions`.
  - returns — An FpsScaffold with the app and an `orientation()` reader
for HUDs.

  <details><summary>Example</summary>

  ```ts
  const fps = createFpsScaffold({ canvas, speed: 7, groundHeight: (x, z) => terrain.height(x, z) })
  fps.app.start()
  ```
  </details>
- **`createIsoScaffold`** *(function)* — Isometric-scene scaffold in one call: `createApp` with an orthographic iso.

  ```ts
  function createIsoScaffold<S extends object = Record<string, unknown>>({ state, viewSize, flavor, near, far, pan, zoom, ground: groundOptions, ...appOptions }: IsoScaffoldOptions<S>): IsoScaffold<S>;
  ```
  - `options` — State source, iso camera flavor, pan/zoom/ground settings,
and the remaining `AppOptions`.
  - returns — An IsoScaffold exposing the app, camera, pan `focus`, and
ground handle.

  <details><summary>Example</summary>

  ```ts
  const iso = createIsoScaffold({ canvas, state: store, ground: { tile: 8 } })
  iso.app.start()
  ```
  </details>
- **`createOrbitScaffold`** *(function)* — Product/model-viewer scaffold: `createApp` with the built-in pointer orbit,.

  ```ts
  function createOrbitScaffold<S extends object = Record<string, unknown>>({ state, autoRotate, ...appOptions }: OrbitScaffoldOptions<S>): OrbitScaffold<S>;
  ```
  - `options` — State source, `autoRotate` speed, and the remaining
`AppOptions`.
  - returns — An OrbitScaffold with the app, the `stage` group, and
`fitTo(object, margin)` which distances the camera so the object's bounding
sphere fits with `margin` headroom (default 1.25).

  <details><summary>Example</summary>

  ```ts
  const viewer = createOrbitScaffold({ canvas, autoRotate: 0.4 })
  viewer.stage.add(model)
  viewer.fitTo(model)
  viewer.app.start()
  ```
  </details>
- **`createRailsScaffold`** *(function)* — On-rails scaffold: an endless segment stream stitched into one curve and a.

  ```ts
  function createRailsScaffold<S extends object = Record<string, unknown>>({ state, segment, prefetchDistance, maxActive, lift, tension, yawRange, pitchRange, smoothing, speed, ...appOptions }: RailsScaffoldOptions<S>): RailsScaffold<S>;
  ```
  - `options` — State source, the deterministic `segment` builder,
`prefetchDistance`, plus segment-stream and path-camera tuning.
  - returns — A RailsScaffold with the app, the segment `stream`, and
the path-camera `rig`.

  <details><summary>Example</summary>

  ```ts
  const ride = createRailsScaffold({ canvas, segment: (i, rng) => tunnelSegment(rng) })
  ride.app.start()
  ```
  </details>
- **`createTppScaffold`** *(function)* — Third-person scaffold: `createApp` with the built-in orbit disabled and a.

  ```ts
  function createTppScaffold<S extends object = Record<string, unknown>>({ state, target, offset, lookAhead, stiffness, rotationStiffness, ...appOptions }: TppScaffoldOptions<S>): TppScaffold<S>;
  ```
  - `options` — State source, chase `target`, local-frame `offset` and
`lookAhead`, damping stiffness, and the remaining `AppOptions`.
  - returns — A TppScaffold with the app and `setTarget`.

  <details><summary>Example</summary>

  ```ts
  const tpp = createTppScaffold({ canvas, target: hero, offset: [0, 4, -8] })
  tpp.app.start()
  ```
  </details>
- **`FpsScaffold`** *(interface)* — Handle returned by createFpsScaffold.
- **`FpsScaffoldOptions`** *(interface)* — Options for createFpsScaffold: `AppOptions` minus orbit/state, plus movement/look tuning and collision/terrain hooks.
- **`IsoScaffold`** *(interface)* — Handle returned by createIsoScaffold.
- **`IsoScaffoldOptions`** *(interface)* — Options for createIsoScaffold: `AppOptions` minus camera/orbit/state, plus the iso camera settings and pan/zoom/ground wiring.
- **`OrbitScaffold`** *(interface)* — Handle returned by createOrbitScaffold.
- **`OrbitScaffoldOptions`** *(interface)* — Options for createOrbitScaffold: `AppOptions` plus an `autoRotate` turntable speed.
- **`RailsScaffold`** *(interface)* — Handle returned by createRailsScaffold.
- **`RailsScaffoldOptions`** *(interface)* — Options for createRailsScaffold: `AppOptions` minus orbit/state, plus segment-stream and path-camera tuning and the `segment` factory.
- **`TppScaffold`** *(interface)* — Handle returned by createTppScaffold.
- **`TppScaffoldOptions`** *(interface)* — Options for createTppScaffold: `AppOptions` minus orbit/state, plus the chase target and follow-camera tuning.

  <details><summary>Example</summary>

  ```ts
  import { createIsoScaffold, createOrbitScaffold } from 'threejs-scenes/scaffold'
  ```
  </details>

#### `threejs-scenes/webgpu`

Experimental WebGPU/TSL node post-processing helpers isolated from the WebGL barrel so standard scenes never need to resolve three/webgpu.

- **`createAfterImage`** *(function)* — Wrap an AfterImageNode that blends each frame with a damped copy of the previous one, creating motion-ghost trails.

  ```ts
  function createAfterImage(input: ColorNode, options?: AfterImageOptions): import("three/addons/tsl/display/AfterImageNode.js").default;
  ```
- **`createAnamorphic`** *(function)* — Wrap an AnamorphicNode that produces horizontal streak lens flares from bright highlights.

  ```ts
  function createAnamorphic(input: ColorNode, options?: AnamorphicOptions): import("three/addons/tsl/display/AnamorphicNode.js").default;
  ```
- **`createAo`** *(function)* — Wrap a GTAONode that computes screen-space ambient occlusion from viewZ and normal, producing contact shadows in creases.

  ```ts
  function createAo(viewZ: ColorNode, normal: ColorNode, camera: THREE.Camera): import("three/addons/tsl/display/GTAONode.js").default;
  ```
- **`createBloom`** *(function)* — Wrap a BloomNode that spreads light from bright pixels for a glow effect.

  ```ts
  function createBloom(input: ColorNode, options?: BloomOptions): import("three/addons/tsl/display/BloomNode.js").default;
  ```
- **`createBloomEmissive`** *(function)* — Bloom only the emissive PBR channel by extracting it from an MRT scene pass, leaving lit surfaces unwashed.

  ```ts
  function createBloomEmissive(scenePass: PassNode, options?: BloomEmissiveOptions): {
  ```
- **`createBloomSelective`** *(function)* — Bloom only objects tagged via an MRT bloomIntensity channel.

  ```ts
  function createBloomSelective(scenePass: PassNode, options?: BloomSelectiveOptions): {
  ```
- **`createChromaticAberration`** *(function)* — Wrap a ChromaticAberrationNode that splits R/G/B radially from a configurable centre for a lens-fringing look.

  ```ts
  function createChromaticAberration(input: ColorNode, options?: ChromaticAberrationOptions): import("three/addons/tsl/display/ChromaticAberrationNode.js").default;
  ```
- **`createDifference`** *(function)* — Increase saturation where the current frame differs from the previous one, highlighting motion.

  ```ts
  function createDifference(scenePass: PassNode, options?: DifferenceOptions): import("three/webgpu").Node<"vec3">;
  ```
- **`createDof`** *(function)* — Wrap a DepthOfFieldNode that applies bokeh-blur by distance from the focus plane.

  ```ts
  function createDof(input: ColorNode, viewZ: ColorNode, options?: DofOptions): import("three/addons/tsl/display/DepthOfFieldNode.js").default;
  ```
- **`createDofBasic`** *(function)* — Cheap DOF: box-blur the colour input, then lerp sharp<->blurred by smoothstep over view-Z distance to the focus point.

  ```ts
  function createDofBasic(input: Node<'vec4'>, viewZ: Node<'float'>, options?: DofBasicOptions): Node<"vec4">;
  ```
- **`createFxaa`** *(function)* — Wrap an FXAANode that applies fast-approximate anti-aliasing on the final image.

  ```ts
  function createFxaa(input: ColorNode): import("three/addons/tsl/display/FXAANode.js").default;
  ```
- **`createGodrays`** *(function)* — Wrap a GodraysNode that ray-marches the depth buffer from a directional or point light to produce volumetric light shafts.

  ```ts
  function createGodrays(depthNode: TextureNode, camera: Camera, light: DirectionalLight | PointLight, options?: GodraysOptions): import("three/addons/tsl/display/GodraysNode.js").default;
  ```
- **`createLensflare`** *(function)* — Wrap a LensflareNode that renders ghost reflections and halo from bright spots.

  ```ts
  function createLensflare(input: Node, options?: LensflareOptions): import("three/addons/tsl/display/LensflareNode.js").default;
  ```
- **`createLut`** *(function)* — Wrap a Lut3DNode that remaps colours through a loaded 3D LUT (.cube/.3dl/.png).

  ```ts
  function createLut(input: ColorNode, options: LutOptions): import("three/addons/tsl/display/Lut3DNode.js").default;
  ```
- **`createMasking`** *(function)* — Stencil-style masking: composite textures into screen regions covered by helper mask scenes, using each pass's alpha.

  ```ts
  function createMasking(base: Node<'vec4'>, camera: THREE.Camera, layers: MaskLayer[]): Node;
  ```
- **`createMotionBlur`** *(function)* — Wrap a motionBlur node that smears colour along each pixel's screen-space velocity vector.

  ```ts
  function createMotionBlur(input: Node, velocityNode: Node, options?: MotionBlurOptions): Node<"vec4">;
  ```
- **`createOutline`** *(function)* — Wrap an OutlineNode that renders edge highlights around selected objects via a separate selection pass.

  ```ts
  function createOutline(scene: THREE.Scene, camera: THREE.Camera, options?: OutlineOptions): import("three/addons/tsl/display/OutlineNode.js").default;
  ```
- **`createPixelationPass`** *(function)* — Wrap a pixelationPass PassNode that renders the scene into chunky pixels with optional normal/depth edge outlines.

  ```ts
  function createPixelationPass(scene: THREE.Scene, camera: THREE.Camera, options?: PixelOptions): import("three/addons/tsl/display/PixelationPassNode.js").default;
  ```
- **`createRadialBlur`** *(function)* — Wrap a radialBlur node that streaks the image outward from centre for a speed / hyperspace look.

  ```ts
  function createRadialBlur(input: ColorNode, options?: RadialBlurOptions): import("three/webgpu").Node;
  ```
- **`createRenderPipeline`** *(function)* — Wrap a composed output node in a RenderPipeline instance.

  ```ts
  function createRenderPipeline(renderer: Renderer, outputNode: Node): RenderPipeline;
  ```
- **`createRetroPass`** *(function)* — Wrap a retroPass PassNode that emulates 5th-gen console rendering: low resolution, vertex snapping, and affine texture distortion.

  ```ts
  function createRetroPass(scene: THREE.Scene, camera: THREE.Camera, options?: RetroOptions): import("three/addons/tsl/display/RetroPassNode.js").default;
  ```
- **`createScenePass`** *(function)* — Create a basic colour-only scene PassNode returning targets: color, viewZ, and normal.

  ```ts
  function createScenePass(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
  ```
- **`createScenePassEmissive`** *(function)* — Create a scene PassNode exposing the emissive PBR contribution as its own MRT channel for emissive-only bloom.

  ```ts
  function createScenePassEmissive(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createScenePassMRT`** *(function)* — Create a scene PassNode with an MRT layout exposing a normal buffer for geometry-aware effects (AO, SSR, SSGI, SSS, TRAA).

  ```ts
  function createScenePassMRT(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
  ```
- **`createScenePassSSR`** *(function)* — Create a scene PassNode with an MRT layout encoding view normals to colour and packing metalness/roughness into a single attachment, for screen-space reflections.

  ```ts
  function createScenePassSSR(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createScenePassVelocity`** *(function)* — Create a scene PassNode exposing a per-pixel screen-space velocity MRT channel for motion blur and TRAA.

  ```ts
  function createScenePassVelocity(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createSmaa`** *(function)* — Wrap an SMAANode that applies subpixel morphological anti-aliasing with higher-quality edges than FXAA.

  ```ts
  function createSmaa(input: ColorNode): import("three/addons/tsl/display/SMAANode.js").SMAANode;
  ```
- **`createSobel`** *(function)* — Wrap a SobelOperatorNode that detects edges via the Sobel gradient operator.

  ```ts
  function createSobel(input: ColorNode): import("three/addons/tsl/display/SobelOperatorNode.js").default;
  ```
- **`createSsaaPass`** *(function)* — Wrap an ssaaPass PassNode that renders the scene at 2^sampleLevel jittered subpixel offsets and averages them for reference-quality anti-aliasing.

  ```ts
  function createSsaaPass(scene: THREE.Scene, camera: THREE.Camera, options?: SsaaOptions): import("three/addons/tsl/display/SSAAPassNode.js").default;
  ```
- **`createSsgi`** *(function)* — Wrap an SSGINode that ray-marches the depth/normal buffers for one bounce of indirect light plus screen-space AO.

  ```ts
  function createSsgi(beautyNode: Node, depthNode: Node, normalNode: Node, camera: PerspectiveCamera, options?: SsgiOptions): import("three/addons/tsl/display/SSGINode.js").default;
  ```
- **`createSsr`** *(function)* — Wrap an SSRNode that ray-marches the depth buffer for glossy screen-space reflections.

  ```ts
  function createSsr(colorNode: Node, depthNode: Node, normalNode: Node, metalness: Node, roughness: Node, camera: Camera, options?: SsrOptions): import("three/addons/tsl/display/SSRNode.js").default;
  ```
- **`createSss`** *(function)* — Wrap an SSSNode that approximates subsurface scattering by ray-marching shadow depth toward the main directional light.

  ```ts
  function createSss(depthNode: TextureNode, camera: Camera, mainLight: DirectionalLight, options?: SssOptions): import("three/addons/tsl/display/SSSNode.js").default;
  ```
- **`createTraa`** *(function)* — Wrap a TRAANode that jitters the camera each frame and blends reprojected history via per-pixel velocity for sub-pixel anti-aliasing and stochastic denoising.

  ```ts
  function createTraa(beautyNode: Node, depthNode: TextureNode, velocityNode: TextureNode, camera: Camera, options?: TraaOptions): import("three/addons/tsl/display/TRAANode.js").default;
  ```
- **`createTransition`** *(function)* — Wrap a TransitionNode that cross-fades two scene pass colour nodes, optionally masked by a wipe texture.

  ```ts
  function createTransition(passA: Node, passB: Node, mixTexture: Node, options?: TransitionOptions): import("three/addons/tsl/display/TransitionNode.js").default;
  ```
- **`createPostProcessing`** *(const)* **deprecated** — Back-compat alias of `createRenderPipeline`.
- **`AfterImageOptions`** *(interface)* — Options for createAfterImage.
- **`AnamorphicOptions`** *(interface)* — Options for createAnamorphic.
- **`BloomEmissiveOptions`** *(interface)* — Options for createBloomEmissive.
- **`BloomOptions`** *(interface)* — Options for createBloom.
- **`BloomSelectiveOptions`** *(interface)* — Options for createBloomSelective.
- **`ChromaticAberrationOptions`** *(interface)* — Options for createChromaticAberration.
- **`ColorEffect`** *(type)* — Generic shape for an effect factory: takes a colour input node and optional options, returns the processed colour node.
- **`ColorNode`** *(type)* — A TSL node carrying colour (vec4).
- **`DifferenceOptions`** *(interface)* — Options for createDifference.
- **`DofBasicOptions`** *(interface)* — Options for createDofBasic.
- **`DofOptions`** *(interface)* — Options for createDof.
- **`GodraysOptions`** *(interface)* — Options for createGodrays.
- **`LensflareOptions`** *(interface)* — Options for createLensflare.
- **`LutOptions`** *(interface)* — Options for createLut.
- **`MaskLayer`** *(interface)* — A scene whose rendered alpha defines a mask region, plus the texture to composite there.
- **`MotionBlurOptions`** *(interface)* — Options for createMotionBlur.
- **`OutlineOptions`** *(type)* — Options for createOutline, mirroring OutlineNodeParams from three.js.
- **`PixelOptions`** *(interface)* — Options for createPixelationPass.
- **`RadialBlurOptions`** *(interface)* — Options for createRadialBlur.
- **`RetroOptions`** *(interface)* — Options for createRetroPass.
- **`ScenePassTargets`** *(interface)* — The set of texture, depth, and normal nodes a scene PassNode can expose.
- **`SsaaOptions`** *(interface)* — Options for createSsaaPass.
- **`SsgiOptions`** *(interface)* — Options for createSsgi.
- **`SsrOptions`** *(interface)* — Options for createSsr.
- **`SssOptions`** *(interface)* — Options for createSss.
- **`TraaOptions`** *(interface)* — Options for createTraa.
- **`TransitionOptions`** *(interface)* — Options for createTransition.

  <details><summary>Example</summary>

  ```ts
  import * as webgpuPost from 'threejs-scenes/webgpu'
  ```
  </details>

#### `threejs-scenes/jsx`

Reactive JSX-style scene authoring without React: render() mounts real three.js objects and function props are re-read on the frame loop.

- **`derived`** *(function)* — A derived accessor — just a memo-free computed read, re-run when polled.

  ```ts
  function derived<T>(fn: Accessor<T>): Accessor<T>;
  ```
- **`h`** *(function)* — Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed.

  ```ts
  function h(type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement;
  ```
- **`isAccessor`** *(function)* — Marker so the reconciler can distinguish accessors from plain values.

  ```ts
  function isAccessor(value: unknown): value is Accessor<unknown>;
  ```
- **`jsx`** *(function)* — Create a `SceneElement` descriptor; the entry point a `react-jsx` transform.

  ```ts
  function jsx(type: ElementType, props: Record<string, unknown> | null): SceneElement;
  ```
  - `type` — Intrinsic tag name, function component, or `Fragment`.
  - `props` — Props object; `children` is split out and normalized.
  - returns — A plain `{ type, props, children }` descriptor.

  <details><summary>Example</summary>

  ```ts
  // tsconfig: { "jsx": "react-jsx", "jsxImportSource": "threejs-scenes/jsx" }
  const tree = <mesh geometry={box} material={mat} position={[0, 1, 0]} />
  ```
  </details>
- **`mountTree`** *(function)* — Mount a tree under the runtime's scene.

  ```ts
  function mountTree(root: SceneChild, rt: Runtime): void;
  ```
- **`render`** *(function)* — Mount a JSX element tree onto a canvas and start rendering.

  ```ts
  function render(root: SceneChild, options: RenderOptions): RenderHandle;
  ```
  - `root` — Element tree built with JSX or `h()`.
  - `options` — Target canvas plus seed, background and orbit settings.
  - returns — A `RenderHandle` whose `dispose()` tears the whole graph down.

  <details><summary>Example</summary>

  ```ts
  const [spin, setSpin] = signal(0)
  const handle = render(
    <scene background='#101018'>
      <light type='directional' position={[3, 5, 2]} />
      <mesh geometry={box} material={mat} rotation={() => [0, spin(), 0]} />
    </scene>,
    { canvas },
  )
  // …later: handle.dispose()
  ```
  </details>
- **`signal`** *(function)* — Create a reactive value as an `[Accessor, Setter]` pair.

  ```ts
  function signal<T>(initial: T): [Accessor<T>, Setter<T>];
  ```
  - `initial` — Starting value.
  - returns — `[get, set]`; pass `get` (or a closure over it) as a JSX prop to
drive that prop every frame.
- **`useAspect`** *(function)* — Canvas aspect-ratio accessor.

  ```ts
  function useAspect(): () => number;
  ```
- **`useCamera`** *(function)* — Accessor for the active camera.

  ```ts
  function useCamera(): () => THREE.Camera;
  ```
- **`useDispose`** *(function)* — Register cleanup to run when the tree is disposed.

  ```ts
  function useDispose(fn: () => void): void;
  ```
- **`useFrame`** *(function)* — Register a per-frame callback ({ delta, elapsed, frame }).

  ```ts
  function useFrame(cb: FrameCallback): void;
  ```
- **`useFrameLoop`** *(function)* — Standalone hook: a FrameLoop backed by the shared frame-capped manager.

  ```ts
  function useFrameLoop(cb?: FrameCallback, options?: FrameLoopOptions): FrameLoop;
  ```
- **`useLoop`** *(function)* — The frame loop driving this tree.

  ```ts
  function useLoop(): FrameLoop;
  ```
- **`useRenderer`** *(function)* — The WebGL renderer driving this tree.

  ```ts
  function useRenderer(): THREE.WebGLRenderer;
  ```
- **`useRng`** *(function)* — The tree's seeded RNG (deterministic per render seed).

  ```ts
  function useRng(): SeededRng;
  ```
- **`useRuntime`** *(function)* — The mounting runtime: scene, renderer, loop, rng, camera accessors, ….

  ```ts
  function useRuntime(): Runtime;
  ```
- **`useScene`** *(function)* — The scene the component mounts into.

  ```ts
  function useScene(): THREE.Scene;
  ```
- **`useSize`** *(function)* — Canvas size accessor: () => [width, height].

  ```ts
  function useSize(): () => [number, number];
  ```
- **`Fragment`** *(const)* — Fragment tag: mounts its children into the parent without adding an object of its own.
- **`jsxDEV`** *(const)* — Dev-transform variant of `jsx` — identical; no dev-mode bookkeeping is kept.
- **`jsxs`** *(const)* — Static-children variant of `jsx` — identical here (children are plain arrays either way).
- **`useDerived`** *(const)* — Computed reactive value derived from other accessors.
- **`useSignal`** *(const)* — Reactive state: const [count, setCount] = useSignal(0).
- **`Accessor`** *(type)* — A zero-argument getter for a reactive value.
- **`CameraProps`** *(interface)* — Props for `<camera>`.
- **`ComponentFn`** *(type)* — A function component: receives props (including `children`) and returns.
- **`ElementType`** *(type)* — What a JSX tag resolves to: an intrinsic name, a `ComponentFn`, or `Fragment`.
- **`Host`** *(interface)* — A mounted intrinsic element: a real three.js object plus its prop applier.
- **`InstancesProps`** *(interface)* — Props for `<instances>`.
- **`LightProps`** *(interface)* — Props for `<light>`.
- **`MeshProps`** *(interface)* — Props for `<mesh>` — a `THREE.Mesh` wrapping caller-supplied geometry and material.
- **`PostProps`** *(interface)* — Props for `<post>`.
- **`PrimitiveProps`** *(interface)* — Props for `<primitive>` — mounts an existing `THREE.Object3D` into the tree as-is (not cloned).
- **`PropProps`** *(interface)* — Props for `<prop>`.
- **`ReactiveBinding`** *(interface)* — Live link between a function-valued JSX prop and the mounted object it.
- **`RenderHandle`** *(interface)* — Live handle returned by `render()`.
- **`RenderOptions`** *(interface)* — Options for `render()`.
- **`Runtime`** *(interface)* — Per-`render()` context threaded through the mount: the shared scene,.
- **`SceneChild`** *(type)* — Anything acceptable as a JSX child.
- **`SceneElement`** *(interface)* — Inert element descriptor produced by `jsx`/`h`.
- **`SceneProps`** *(interface)* — Props for `<scene>`, the root intrinsic element.
- **`Setter`** *(type)* — Writes a signal's value; takes the next value or an updater `prev => next`.

  <details><summary>Example</summary>

  ```ts
  import { render, h, signal } from 'threejs-scenes/jsx'
  ```
  </details>

#### `threejs-scenes/jsx/jsx-runtime`

The jsx/jsxs/Fragment runtime target for tsconfig jsxImportSource plus the hyperscript helper used by no-build demos.

- **`h`** *(function)* — Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed.

  ```ts
  function h(type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement;
  ```
- **`jsx`** *(function)* — Create a `SceneElement` descriptor; the entry point a `react-jsx` transform.

  ```ts
  function jsx(type: ElementType, props: Record<string, unknown> | null): SceneElement;
  ```
  - `type` — Intrinsic tag name, function component, or `Fragment`.
  - `props` — Props object; `children` is split out and normalized.
  - returns — A plain `{ type, props, children }` descriptor.

  <details><summary>Example</summary>

  ```ts
  // tsconfig: { "jsx": "react-jsx", "jsxImportSource": "threejs-scenes/jsx" }
  const tree = <mesh geometry={box} material={mat} position={[0, 1, 0]} />
  ```
  </details>
- **`Fragment`** *(const)* — Fragment tag: mounts its children into the parent without adding an object of its own.
- **`jsxDEV`** *(const)* — Dev-transform variant of `jsx` — identical; no dev-mode bookkeeping is kept.
- **`jsxs`** *(const)* — Static-children variant of `jsx` — identical here (children are plain arrays either way).
- **`ComponentFn`** *(type)* — A function component: receives props (including `children`) and returns.
- **`ElementType`** *(type)* — What a JSX tag resolves to: an intrinsic name, a `ComponentFn`, or `Fragment`.
- **`SceneChild`** *(type)* — Anything acceptable as a JSX child.
- **`SceneElement`** *(interface)* — Inert element descriptor produced by `jsx`/`h`.

  <details><summary>Example</summary>

  ```ts
  import { jsx, jsxs, Fragment } from 'threejs-scenes/jsx/jsx-runtime'
  ```
  </details>

<!-- api:end -->

### at a glance

| Area | Exports |
|------|---------|
| **core** | `createApp` (unidirectional store→module→scene shell), `createClock` (wall / fixed-timestep), `createStore`, `createRenderer`, `attachResizeObserver`, `createFrameLoop`, `bootstrapScene`, `createOverlayScene` / `renderOverlay`, `projectToScreenUv`, `attachPointerGesture`, `disposeScene`, `disposeMaterial`, `detectTier`, `getQualitySettings`, `QUALITY_PRESETS` |
| **procedural** | `createSeededRng` (with `fork(label)`), `mulberry32`, `poissonDisk`, `createNoiseTexture`, `createNoise3D` (simplex + fbm/ridged), `createProceduralBody` (seeded planets) |
| **camera** | `createCameraController` (free/flyTo/follow/cockpit), `tupleToVector3` / `vector3ToTuple` / `targetFromObject`, `createIsoCamera`, `resizeIsoCamera`, `createFollowCamera` |
| **instancing** | `createInstancedField`, `createBatchedBuildings` |
| **geometry extras** | `createConnectionGraph` (kNN LineSegments), `createInfiniteGround` (recentering tiles) |
| **materials** | `createHolographicMaterial` |
| **lighting** | `setupStandardLighting`, `createSun`, `createHemisphereFill`, `applyEnvironment` |
| **particles** | `createEmitter` (shapes, rate/burst, curves over lifetime, deterministic), `createGpuEmitter` (GPGPU >50k), `sampleCurve` / `bakeCurve` / `bakeCurveTexture`, `createParticleEmitter` (deprecated v1) |
| **post** | `createPostPipeline` (reorderable named passes), `createComposer`, `createGradePass` (`GradeShader`), `createGodRaysPass`, `createDofPass`, `createFilmGrainPass`, `createCrtPass` / `crtCorrectPointer`, `createLensingPass`, `createBurnInPass`, `createRgbShiftPass`, `createBlockDisplacementPass`, `createScanCorruptionPass`, `createHudBeamTransition`, `createStereoRenderer` |
| **voxels / infinite** | `VoxelChunk`, `greedyMesh`, `createChunkManager` |
| **architecture** | `createSceneModule`, `createViewRegistry` (LRU view cache), `MaterialPool`, `createProceduralTexture` / `createTextureCache`, `EditStack`, `resolveParam` / `resolveParams`, `pickTopLevel`, `pick` (distortion-aware) / `createClickGuard` |

The frame loop is backed by
[`@tuomashatakka/canvas-loop-framecapper`](https://github.com/tuomashatakka/canvas-loop-framecapper):
one shared `FrameLoopManager` owns the single `requestAnimationFrame` and can
cap it to a fixed frame rate (`createFrameLoop({ fps })` — capped frames get a
fixed `delta = 1/fps`), while each `createFrameLoop()` keeps its own
subscriber set, frame counter and elapsed time (`registerUpdate` /
`unregisterUpdate` / `onFrame`). The LLM codegen module (`scripts/llm-functions.js`) is **not**
ported — it needs `ai` / `@ai-sdk/google` / `zod`, which would be hard deps; use
the script directly if you need it.

### WebGPU / TSL post-processing

Alongside the WebGL `EffectComposer` passes above, the package ships a parallel
set of **WebGPU/TSL node effects** under `lib/post/webgpu/` that mirror the
three.js WebGPU postprocessing examples (afterimage, anamorphic, AO/GTAO, bloom
incl. selective + emissive, chromatic aberration, depth of field, frame
difference, FXAA, god rays, 3D LUT, masking, motion blur, outline, pixelation,
radial blur, retro, SMAA, Sobel, SSAA, SSGI, SSR, SSS, TRAA, transition). They
require a `WebGPURenderer` and are node-based (`three/webgpu` + `three/tsl`),
not `ShaderPass` chains. To avoid name clashes they are exported under a
namespace, or via the `./post/webgpu` subpath:

```ts
import * as webgpuPost from 'threejs-scenes/webgpu'

const { color, viewZ } = webgpuPost.createScenePass(scene, camera)
const bloom = webgpuPost.createBloom(color, { strength: 0.8 })
const graded = webgpuPost.createDof(color.add(bloom), viewZ, { bokehScale: 2 })
const post = webgpuPost.createPostProcessing(renderer, graded)
// in your loop: post.render()
```

Geometry-aware effects (AO, SSR, SSGI, SSS, TRAA) need an MRT scene pass —
use `createScenePassMRT` / `createScenePassVelocity` / `createScenePassSSR`.

## layout

| Path | What's there |
|------|--------------|
| `SKILL.md` | Entry point: reference index, scripts index, embedding patterns, prompt-handling flow. Start here. |
| `references/` | 19 focused docs — load only what the task needs (camera, shaders, post-fx, voxels, performance, anti-patterns, production-lessons, …). |
| `scripts/` | Production-ready ES-module implementations of every reference example. `scripts/INDEX.md` maps each. |
| `lib/` | TypeScript package source — factories/interfaces for every pattern, built to `dist/`. See **package** above. |
| `templates/` | **Runnable, self-contained HTML scenes** — open directly in a browser, no build. See below. |

## templates (run with zero setup)

Each file in `templates/` is a complete HTML page that loads `three` from the
`esm.sh` CDN via an importmap, so it works by **just opening the file in a
browser** (needs internet for the CDN). No bundler, no dev server, no install.

| Template | Demonstrates |
|----------|--------------|
| `minimal-scene.html` | The starter: renderer + orbit camera + lit flat-shaded mesh + resize + dispose. Copy and replace `buildContent()`. |
| `instanced-field.html` | `InstancedMesh` — ~5000 objects in 1 draw call, seeded placement. |
| `shader-material.html` | Custom GLSL `ShaderMaterial` — holographic fresnel + scanlines + noise. |
| `post-processing.html` | `EffectComposer` chain — bloom + linear-HDR colour grade + `OutputPass`. |
| `isometric.html` | Orthographic true-iso camera + instanced height-grid terrain + pan/zoom. |
| `bootstrap.html` | Library starter — `createApp` unidirectional flow, fixed-step clock, seeded particles. |
| `particles.html` | Particles v2 — `createEmitter` shapes/curves/bursts + 65k GPGPU field toggle. |

> The templates intentionally inline their helpers (frame loop, pointer gesture,
> disposal) so there are no local module imports to break under `file://`. For
> multi-module projects, prefer the modules in `scripts/` and an importmap.

## using the skill

1. The agent reads `SKILL.md`, then `references/core-principles.md`.
2. It classifies the request and loads the matching reference doc(s).
3. It reuses a `scripts/` module or a `templates/` page rather than writing from
   scratch, adapting signatures to the request.
4. It ships a complete, working scene with a `// perf:` annotation and a dispose
   path, following the embedding patterns in `SKILL.md`.

## requirements

- A modern browser with WebGL2 (Chrome, Firefox, Safari, Edge).
- Internet access for templates/artifacts (three.js loads from `esm.sh`).
- For headless capture: Chromium via Playwright (`--use-angle=swiftshader` for
  GPU-less CI); scenes set `window.__SCENE_READY__ = true` as the capture signal.
