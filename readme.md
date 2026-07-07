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

```ts
import {
  bootstrapScene,
  createRenderer,
  createFrameLoop,
  createSeededRng,
  createInstancedField,
  createComposer,
  createGradePass,
  MaterialPool,
  VoxelChunk,
  greedyMesh,
} from 'threejs-scenes'

const { scene, camera, loop, dispose } = bootstrapScene({
  canvas,
  onSetup ({ scene }) {
    // build content; return an optional per-frame tick
  },
})
```

The package exports three main, tree-shakeable public entry points:
- `@tuomashatakka/threejs-scenes` (WebGL core, scaffolding, cameras, animations, lighting, materials, geometry, instancing, loaders, and state management)
- `@tuomashatakka/threejs-scenes/webgpu` (Dedicated WebGPU post-processing and TSL effects)
- `@tuomashatakka/threejs-scenes/jsx` (Declarative, reactive JSX layer)

### hooks (`/jsx`)

The `threejs-scenes/jsx` subpath exposes the library's main interfaces as
**hooks** (no React required). Inside a JSX function component the reconciler
provides the mounting runtime, so `useScene()`, `useRenderer()`, `useCamera()`,
`useLoop()`, `useRng()`, `useSize()`, `useAspect()`, `useFrame(cb)` and
`useDispose(fn)` just work; `useFrameLoop(cb?, { fps })` and
`useSignal` / `useDerived` are callable anywhere.

```tsx
import { render, h, useFrame, useSignal } from '@tuomashatakka/threejs-scenes/jsx'

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

#### `@tuomashatakka/threejs-scenes`

The unified WebGL API: app scaffolding, renderer loops, cameras, materials, geometry, instancing, loaders, animation, props, lighting, particles, post-processing, voxels, procedural helpers, state, and architecture utilities.

- **`applyBend`** *(function)* — Bend the geometry into an arc of `angle` radians around its `axis` extent.

  ```ts
  function applyBend(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`applyEnvironment`** *(function)*

  ```ts
  function applyEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { intensity, envScene }?: EnvironmentOptions): THREE.Texture;
  ```
- **`applyTaper`** *(function)* — Taper: the two axes perpendicular to `axis` scale from 1 to `factor` along it.

  ```ts
  function applyTaper(geo: THREE.BufferGeometry, factor: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`applyTwist`** *(function)* — Twist around `axis`: rotation grows linearly from 0 to `angle` along the axis.

  ```ts
  function applyTwist(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
  ```
- **`attachPointerGesture`** *(function)*

  ```ts
  function attachPointerGesture(el: HTMLElement, callbacks: PointerGestureCallbacks, { tapThresholdMs, tapMovePx }?: PointerGestureOptions): () => void;
  ```
- **`attachResizeObserver`** *(function)*

  ```ts
  function attachResizeObserver(renderer: THREE.WebGLRenderer, camera: THREE.Camera, canvas: HTMLCanvasElement, onResize?: ResizeHandler): () => void;
  ```
- **`bakeCurve`** *(function)* — Bake a scalar curve into a Float32Array LUT of `resolution` samples.

  ```ts
  function bakeCurve(curve: ScalarCurve, resolution?: number): Float32Array;
  ```
- **`bakeCurveTexture`** *(function)* — Bake color + alpha + size curves into one 2-row RGBA DataTexture:.

  ```ts
  function bakeCurveTexture(color: ColorCurve, alpha: ScalarCurve, size: ScalarCurve, resolution?: number): THREE.DataTexture;
  ```
- **`bindSceneEvents`** *(function)*

  ```ts
  function bindSceneEvents({ element, camera, bindings, correctPointer, }: SceneEventsOptions): SceneEvents;
  ```
- **`bindStateSource`** *(function)*

  ```ts
  function bindStateSource<S extends object>(target: TargetType<S>, source: StateSource<S> | undefined): () => void;
  ```
- **`bobClip`** *(function)* — Vertical bob (sine, seamless loop).

  ```ts
  function bobClip(amp?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`bootstrapScene`** *(function)*

  ```ts
  function bootstrapScene({ canvas, onSetup }: BootstrapOptions): BootstrappedScene;
  ```
- **`clearModelCache`** *(function)*

  ```ts
  function clearModelCache(): void;
  ```
- **`clipFromTracks`** *(function)*

  ```ts
  function clipFromTracks(name: string, duration: number, tracks: THREE.KeyframeTrack[]): THREE.AnimationClip;
  ```
- **`combineClips`** *(function)*

  ```ts
  function combineClips(name: string, clips: THREE.AnimationClip[]): THREE.AnimationClip;
  ```
- **`createAnimationController`** *(function)*

  ```ts
  function createAnimationController(root: THREE.Object3D, clips?: THREE.AnimationClip[], loop?: FrameLoop): AnimationController;
  ```
- **`createApp`** *(function)*

  ```ts
  function createApp<S extends object = Record<string, unknown>, A = Partial<S>>({ canvas, state, reducer, seed, clock, renderer: rendererOptions, camera: cameraOptions, background, lighting, orbit, modules, onFrame, onResize, render, }: AppOptions<S, A>): App<S, A>;
  ```
- **`createBatchedBuildings`** *(function)*

  ```ts
  function createBatchedBuildings({ geometries, material, transforms, sortObjects, perObjectFrustumCulled, }: BatchedBuildingsOptions): THREE.BatchedMesh;
  ```
- **`createBlockDisplacementPass`** *(function)*

  ```ts
  function createBlockDisplacementPass(): ShaderPass;
  ```
- **`createCameraController`** *(function)*

  ```ts
  function createCameraController(camera: THREE.PerspectiveCamera, { stiffness, lookStiffness, fovStiffness, arriveEpsilon, bounds, }?: CameraControllerOptions): CameraController;
  ```
- **`createChunkManager`** *(function)*

  ```ts
  function createChunkManager({ chunkSize, viewRadius, rebaseThreshold, build, }: ChunkManagerOptions): ChunkManager;
  ```
- **`createCinematicLUT`** *(function)* — Build a cinematic colour-grading 3D LUT as a `Data3DTexture`: a gentle.

  ```ts
  function createCinematicLUT(size?: number, { contrast, splitTone, saturation }?: CinematicLutOptions): THREE.Data3DTexture;
  ```
- **`createClickGuard`** *(function)*

  ```ts
  function createClickGuard(thresholdPx?: number): CreateClickGuardReturnType;
  ```
- **`createClock`** *(function)*

  ```ts
  function createClock({ mode, step, maxSubSteps }?: ClockOptions): Clock;
  ```
- **`createComposer`** *(function)*

  ```ts
  function createComposer({ renderer, scene, camera, width, height, withDepth, withBloom, bloomStrength, bloomRadius, bloomThreshold, }: ComposerOptions): ComposerHandle;
  ```
- **`createConnectionGraph`** *(function)*

  ```ts
  function createConnectionGraph(nodes: ReadonlyArray<readonly [number, number, number]>, { neighbors, maxDistance, color, highlightColor, opacity, }?: ConnectionGraphOptions): ConnectionGraph;
  ```
- **`createDofPass`** *(function)*

  ```ts
  function createDofPass({ focalDistance, focalRange, maxBlur, caStrength, near, far, }?: DofPassOptions): DofPass;
  ```
- **`createEmitter`** *(function)*

  ```ts
  function createEmitter({ capacity, rate, bursts, lifetime, shape, speed, gravity, damping, size, sizeCurve, color, alphaCurve, rotation, texture, blending, seed, }: EmitterOptions): Emitter;
  ```
- **`createExtrudedMesh`** *(function)*

  ```ts
  function createExtrudedMesh(options: ExtrudeOptions): THREE.Mesh;
  ```
- **`createFilmGrainPass`** *(function)*

  ```ts
  function createFilmGrainPass({ intensity, luma, desat, }?: FilmGrainOptions): ShaderPass;
  ```
- **`createFollowCamera`** *(function)*

  ```ts
  function createFollowCamera(camera: THREE.Camera, target: THREE.Object3D, { offset, lookAhead, stiffness, rotationStiffness, }: FollowCameraOptions): CameraController;
  ```
- **`createFpsScaffold`** *(function)*

  ```ts
  function createFpsScaffold<S extends object = Record<string, unknown>>({ state, speed, lookSpeed, eyeHeight, pointerLock, collide, groundHeight, ...appOptions }: FpsScaffoldOptions<S>): FpsScaffold<S>;
  ```
- **`createFrameLoop`** *(function)*

  ```ts
  function createFrameLoop({ clock: simClock, fps }?: FrameLoopOptions): FrameLoop;
  ```
- **`createGLTFLoader`** *(function)*

  ```ts
  function createGLTFLoader(options?: GLTFLoaderOptions): GLTFLoader;
  ```
- **`createGodRaysPass`** *(function)*

  ```ts
  function createGodRaysPass(): GodRaysPass;
  ```
- **`createGpuEmitter`** *(function)*

  ```ts
  function createGpuEmitter(renderer: THREE.WebGLRenderer, options: GpuEmitterOptions): Emitter;
  ```
- **`createGradePass`** *(function)*

  ```ts
  function createGradePass({ tint, contrast, saturation, vignette, grain, chromatic, }?: GradePassOptions): GradePass;
  ```
- **`createGradientToonMap`** *(function)* — Quantized gradient ramp for cel shading — NearestFilter keeps the bands hard.

  ```ts
  function createGradientToonMap(steps?: number): THREE.DataTexture;
  ```
- **`createGroup`** *(function)*

  ```ts
  function createGroup(children?: THREE.Object3D[], transform?: Transform): THREE.Group;
  ```
- **`createHemisphereFill`** *(function)*

  ```ts
  function createHemisphereFill({ skyColor, groundColor, intensity, }?: HemisphereFillOptions): THREE.HemisphereLight;
  ```
- **`createHolographicMaterial`** *(function)*

  ```ts
  function createHolographicMaterial({ baseColor, fresnelStrength, scanlineDensity, opacity, }?: HolographicMaterialOptions): TickableMaterial;
  ```
- **`createHudBeamTransition`** *(function)*

  ```ts
  function createHudBeamTransition({ duration, beamWidth, beamColor, onComplete, }?: HudBeamOptions): HudBeamTransition;
  ```
- **`createInfiniteGround`** *(function)*

  ```ts
  function createInfiniteGround({ tileSize, gridRadius, segments, displace, material, }?: InfiniteGroundOptions): InfiniteGround;
  ```
- **`createInstancedField`** *(function)*

  ```ts
  function createInstancedField({ geometry, material, count, radius, seed, hueBase, hueSpread, scaleMin, scaleMax, place, }: InstancedFieldOptions): THREE.InstancedMesh;
  ```
- **`createInstancedProp`** *(function)*

  ```ts
  function createInstancedProp(factory: PropFactory, options: InstancedPropOptions, ctx?: PropContext): InstancedPropResult;
  ```
- **`createIsoCamera`** *(function)*

  ```ts
  function createIsoCamera(aspect: number, { viewSize, flavor, near, far, }?: IsoCameraOptions): THREE.OrthographicCamera;
  ```
- **`createIsoScaffold`** *(function)*

  ```ts
  function createIsoScaffold<S extends object = Record<string, unknown>>({ state, viewSize, flavor, near, far, pan, zoom, ground: groundOptions, ...appOptions }: IsoScaffoldOptions<S>): IsoScaffold<S>;
  ```
- **`createLatheMesh`** *(function)*

  ```ts
  function createLatheMesh(profile: ReadonlyArray<readonly [number, number] | THREE.Vector2>, options?: LatheOptions): THREE.Mesh;
  ```
- **`createLightCone`** *(function)*

  ```ts
  function createLightCone(from: THREE.Vector3, to: THREE.Vector3, { color, spread }?: LightConeOptions): THREE.Mesh;
  ```
- **`createLightingRig`** *(function)*

  ```ts
  function createLightingRig(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { preset, shadows, presets }?: LightingRigOptions): LightingRig;
  ```
- **`createMatcapMaterial`** *(function)* — Matcap material.

  ```ts
  function createMatcapMaterial(matcap?: THREE.Texture | string): THREE.MeshMatcapMaterial;
  ```
- **`createModelCache`** *(function)*

  ```ts
  function createModelCache(): ModelCache;
  ```
- **`createNoise3D`** *(function)*

  ```ts
  function createNoise3D(seed?: number): Noise3D;
  ```
- **`createNoiseTexture`** *(function)*

  ```ts
  function createNoiseTexture({ size, frequency, octaves, seed, channels, }?: NoiseTextureOptions): THREE.DataTexture | null;
  ```
- **`createOrbitScaffold`** *(function)*

  ```ts
  function createOrbitScaffold<S extends object = Record<string, unknown>>({ state, autoRotate, ...appOptions }: OrbitScaffoldOptions<S>): OrbitScaffold<S>;
  ```
- **`createOverlayScene`** *(function)*

  ```ts
  function createOverlayScene(camera: THREE.Camera): OverlayHandle;
  ```
- **`createParticleEmitter`** *(function)*

  ```ts
  function createParticleEmitter({ count, texture, bounds, seed, gravity, damping, }: ParticleEmitterOptions): ParticleEmitter;
  ```
- **`createPathCamera`** *(function)*

  ```ts
  function createPathCamera(camera: THREE.PerspectiveCamera, path: PathCameraSource, element: HTMLElement, { yawRange, pitchRange, smoothing, speed }?: PathCameraOptions): PathCamera;
  ```
- **`createPathTube`** *(function)* — Sweep a circle through parallel-transport frames along `points`.

  ```ts
  function createPathTube(points: THREE.Vector3[], { radius, radialSegments, inward, vRepeat }?: PathTubeOptions): THREE.BufferGeometry;
  ```
- **`createPostPipeline`** *(function)*

  ```ts
  function createPostPipeline({ renderer, scene, camera, width, height, withDepth, }: PostPipelineOptions): PostPipeline;
  ```
- **`createProceduralBody`** *(function)*

  ```ts
  function createProceduralBody({ radius, detail, seed, type, displacement, frequency, octaves, ridged, palette, water, clouds, rings, }?: ProceduralBodySpec): ProceduralBody;
  ```
- **`createProceduralTexture`** *(function)*

  ```ts
  function createProceduralTexture(key: string, paint: PaintFn, size?: number): THREE.CanvasTexture | null;
  ```
- **`createProp`** *(function)*

  ```ts
  function createProp(factory: PropFactory, ctx?: PropContext, options?: CreatePropOptions): PropInstance;
  ```
- **`createPropComposite`** *(function)*

  ```ts
  function createPropComposite(parts: CompositePart[]): PropComposite;
  ```
- **`createPropRegistry`** *(function)*

  ```ts
  function createPropRegistry(): PropRegistry;
  ```
- **`createRailsScaffold`** *(function)*

  ```ts
  function createRailsScaffold<S extends object = Record<string, unknown>>({ state, segment, prefetchDistance, maxActive, lift, tension, yawRange, pitchRange, smoothing, speed, ...appOptions }: RailsScaffoldOptions<S>): RailsScaffold<S>;
  ```
- **`createRenderer`** *(function)*

  ```ts
  function createRenderer({ canvas, antialias, pixelRatioMax, shadows, toneMapping, toneMappingExposure, logarithmicDepthBuffer, }: RendererOptions): THREE.WebGLRenderer;
  ```
- **`createRgbShiftPass`** *(function)*

  ```ts
  function createRgbShiftPass(): ShaderPass;
  ```
- **`createScanCorruptionPass`** *(function)*

  ```ts
  function createScanCorruptionPass(): ShaderPass;
  ```
- **`createSceneModule`** *(function)*

  ```ts
  function createSceneModule(def: SceneModuleDefinition): SceneModule;
  ```
- **`createSeededRng`** *(function)*

  ```ts
  function createSeededRng(seed: number): SeededRng;
  ```
- **`createSegmentStream`** *(function)*

  ```ts
  function createSegmentStream(scene: THREE.Scene, { maxActive, lift, tension }?: SegmentStreamOptions): SegmentStream;
  ```
- **`createShaderQuad`** *(function)*

  ```ts
  function createShaderQuad({ fragmentShader, uniforms, pointerElement }: ShaderQuadOptions): ShaderQuad;
  ```
- **`createSkybox`** *(function)*

  ```ts
  function createSkybox(scene: THREE.Scene, { color, gradient, equirect, cube, environment, radius, }: SkyboxOptions): Skybox;
  ```
- **`createStandardMaterial`** *(function)* — Build a PBR material from a preset name (or raw params), merged with optional.

  ```ts
  function createStandardMaterial(presetOrParams?: StandardPresetName | THREE.MeshStandardMaterialParameters, overrides?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
  ```
- **`createStereoRenderer`** *(function)*

  ```ts
  function createStereoRenderer(renderer: THREE.WebGLRenderer, mode: StereoMode, { width, height }?: StereoSizeOptions): StereoRenderer;
  ```
- **`createStore`** *(function)*

  ```ts
  function createStore<S extends object, A = Partial<S>>(initial: S, reducer?: Reducer<S, A>): Store<S, A>;
  ```
- **`createSun`** *(function)*

  ```ts
  function createSun({ color, intensity, position, shadowMapSize, shadowFrustum, shadowFar, }?: SunOptions): THREE.DirectionalLight;
  ```
- **`createTextureCache`** *(function)*

  ```ts
  function createTextureCache(): TextureCache;
  ```
- **`createToonMaterial`** *(function)*

  ```ts
  function createToonMaterial(options?: ToonOptions): THREE.MeshToonMaterial;
  ```
- **`createTppScaffold`** *(function)*

  ```ts
  function createTppScaffold<S extends object = Record<string, unknown>>({ state, target, offset, lookAhead, stiffness, rotationStiffness, ...appOptions }: TppScaffoldOptions<S>): TppScaffold<S>;
  ```
- **`createTriplanarMaterial`** *(function)*

  ```ts
  function createTriplanarMaterial({ palette, tileScale, fogDistance, side, }?: TriplanarMaterialOptions): THREE.ShaderMaterial;
  ```
- **`createViewRegistry`** *(function)*

  ```ts
  function createViewRegistry<S = unknown>({ create, limit }: ViewRegistryOptions<S>): ViewRegistry<S>;
  ```
- **`defineProp`** *(function)* — Validate + tag a prop definition.

  ```ts
  function defineProp(def: PropDefinition): PropFactory;
  ```
- **`detectTier`** *(function)*

  ```ts
  function detectTier(): QualityTier;
  ```
- **`displaceByNoise`** *(function)* — Push each vertex along its normal by seeded value noise.

  ```ts
  function displaceByNoise(geo: THREE.BufferGeometry, options?: NoiseDisplaceOptions): THREE.BufferGeometry;
  ```
- **`disposeMaterial`** *(function)*

  ```ts
  function disposeMaterial(mat: THREE.Material): void;
  ```
- **`disposeScene`** *(function)*

  ```ts
  function disposeScene(root: THREE.Object3D): void;
  ```
- **`edgeSplit`** *(function)* — Split shared vertices across hard edges so flat-shaded creases stay sharp.

  ```ts
  function edgeSplit(geo: THREE.BufferGeometry, cutOffAngleRad?: number, keepNormals?: boolean): THREE.BufferGeometry;
  ```
- **`EditStack`** *(class)*
- **`extrudeAlongPath`** *(function)*

  ```ts
  function extrudeAlongPath(shape: THREE.Shape, path: THREE.Curve<THREE.Vector3>, options?: ExtrudeAlongPathOptions): THREE.Mesh;
  ```
- **`gearShape`** *(function)*

  ```ts
  function gearShape(teeth: number, outerRadius: number, innerRadius: number, toothDepth?: number): THREE.Shape;
  ```
- **`getProp`** *(function)*

  ```ts
  function getProp(name: string): PropFactory | undefined;
  ```
- **`getQualitySettings`** *(function)*

  ```ts
  function getQualitySettings(tier?: QualityTier): QualitySettings;
  ```
- **`greedyMesh`** *(function)*

  ```ts
  function greedyMesh(chunk: VoxelChunk): THREE.BufferGeometry;
  ```
- **`groupBounds`** *(function)*

  ```ts
  function groupBounds(obj: THREE.Object3D): THREE.Box3;
  ```
- **`hash2`** *(function)*

  ```ts
  function hash2(x: number, y: number): number;
  ```
- **`hash3`** *(function)*

  ```ts
  function hash3(x: number, y: number, z: number): number;
  ```
- **`isStateController`** *(function)*

  ```ts
  function isStateController<S extends object>(source: StateSource<S> | undefined): source is StateController<S>;
  ```
- **`layoutGrid`** *(function)*

  ```ts
  function layoutGrid(objects: THREE.Object3D[], options?: GridLayout): THREE.Object3D[];
  ```
- **`layoutRadial`** *(function)*

  ```ts
  function layoutRadial(objects: THREE.Object3D[], options?: RadialLayout): THREE.Object3D[];
  ```
- **`layoutStack`** *(function)*

  ```ts
  function layoutStack(objects: THREE.Object3D[], axis?: Axis, spacing?: number): THREE.Object3D[];
  ```
- **`lerp`** *(function)*

  ```ts
  function lerp(a: number, b: number, t: number): number;
  ```
- **`lerpOnChange`** *(function)* — Apply-on-animate: like {@link tweened}, but pushes each interpolated value.

  ```ts
  function lerpOnChange<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, apply: (value: V) => void, options?: TweenOptions): Disposable & {
  ```
- **`loadGLTF`** *(function)*

  ```ts
  function loadGLTF(url: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
  ```
- **`loadModel`** *(function)*

  ```ts
  function loadModel(src: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
  ```
- **`MaterialPool`** *(class)*
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
- **`mulberry32`** *(function)*

  ```ts
  function mulberry32(seed: number): () => number;
  ```
- **`numberTrack`** *(function)*

  ```ts
  function numberTrack(targetPath: string, times: number[], values: number[]): THREE.NumberKeyframeTrack;
  ```
- **`parallelTransportFrames`** *(function)* — Twist-free coordinate frames along a polyline (parallel transport).

  ```ts
  function parallelTransportFrames(points: THREE.Vector3[]): TransportFrames;
  ```
- **`pick`** *(function)* — pickTopLevel with a distortion hook + object scoping.

  ```ts
  function pick(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, { isPickable, distortion, objects }?: PickOptions): PickResult | null;
  ```
- **`pickTopLevel`** *(function)*

  ```ts
  function pickTopLevel(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, isPickable?: PickFilter): PickResult | null;
  ```
- **`poissonDisk`** *(function)*

  ```ts
  function poissonDisk({ width, height, minDist, rng, k, }: PoissonDiskOptions): Point2[];
  ```
- **`polygonShape`** *(function)*

  ```ts
  function polygonShape(sides: number, radius: number): THREE.Shape;
  ```
- **`projectToScreenUv`** *(function)*

  ```ts
  function projectToScreenUv(object: THREE.Object3D, camera: THREE.Camera, out?: ScreenProjection): ScreenProjection;
  ```
- **`pulseScaleClip`** *(function)* — Uniform scale pulse between `min` and `max`.

  ```ts
  function pulseScaleClip(min?: number, max?: number, duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`quaternionTrack`** *(function)*

  ```ts
  function quaternionTrack(targetPath: string, times: number[], values: number[]): THREE.QuaternionKeyframeTrack;
  ```
- **`recomputeNormals`** *(function)*

  ```ts
  function recomputeNormals(geo: THREE.BufferGeometry): THREE.BufferGeometry;
  ```
- **`registerProp`** *(function)*

  ```ts
  function registerProp(name: string, factory: PropFactory): void;
  ```
- **`renderOverlay`** *(function)* — Composer-free path: call after renderer.render(mainScene, camera).

  ```ts
  function renderOverlay(renderer: THREE.WebGLRenderer, overlayScene: THREE.Scene, camera: THREE.Camera): void;
  ```
- **`resizeIsoCamera`** *(function)*

  ```ts
  function resizeIsoCamera(camera: THREE.OrthographicCamera, aspect: number): void;
  ```
- **`resolveInitialState`** *(function)* — Mirror an external controller into an app: seed with `resolveInitialState`,.

  ```ts
  function resolveInitialState<S extends object>(source: StateSource<S> | undefined, fallback: S): S;
  ```
- **`resolveParam`** *(function)*

  ```ts
  function resolveParam(spec: ParamSpec, given: unknown): ParamValue;
  ```
- **`resolveParams`** *(function)*

  ```ts
  function resolveParams(specs: ParamSpecMap, given?: Record<string, unknown>): Record<string, ParamValue>;
  ```
- **`resolveProp`** *(function)*

  ```ts
  function resolveProp(src: PropFactory | string, ctx?: PropContext): Promise<PropInstance>;
  ```
- **`ringShape`** *(function)*

  ```ts
  function ringShape(outerRadius: number, innerRadius: number): THREE.Shape;
  ```
- **`roundedRectShape`** *(function)*

  ```ts
  function roundedRectShape(width: number, height: number, radius: number): THREE.Shape;
  ```
- **`sampleCurve`** *(function)* — Sample a scalar curve at t.

  ```ts
  function sampleCurve(curve: ScalarCurve, t: number): number;
  ```
- **`sampleShape`** *(function)* — Sample a spawn position + emission direction from an emitter shape.

  ```ts
  function sampleShape(shape: EmitterShape, r: () => number, out: SpawnSample): void;
  ```
- **`setupStandardLighting`** *(function)*

  ```ts
  function setupStandardLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options?: StandardLightingOptions): StandardLighting;
  ```
- **`simplifyGeometry`** *(function)* — Collapse to roughly `targetCount` vertices via SimplifyModifier.

  ```ts
  function simplifyGeometry(geo: THREE.BufferGeometry, targetCount: number): THREE.BufferGeometry;
  ```
- **`smoothstep`** *(function)*

  ```ts
  function smoothstep(edge0: number, edge1: number, x: number): number;
  ```
- **`spinClip`** *(function)* — Continuous 360° rotation around `axis`.

  ```ts
  function spinClip(axis?: 'x' | 'y' | 'z', duration?: number, name?: string): THREE.AnimationClip;
  ```
- **`starShape`** *(function)*

  ```ts
  function starShape(points: number, outerRadius: number, innerRadius: number): THREE.Shape;
  ```
- **`targetFromObject`** *(function)* — Frame an object: stand `distance` away along `direction`, look at its center.

  ```ts
  function targetFromObject(object: THREE.Object3D, distance: number, direction?: Vec3Tuple): CameraTarget;
  ```
- **`tessellateGeometry`** *(function)* — Subdivide long edges.

  ```ts
  function tessellateGeometry(geo: THREE.BufferGeometry, maxEdgeLength?: number, iterations?: number): THREE.BufferGeometry;
  ```
- **`toController`** *(function)* — Normalize any state source to a controller.

  ```ts
  function toController<S extends object>(source: StateSource<S>): StateController<S>;
  ```
- **`trackFromKeyframes`** *(function)*

  ```ts
  function trackFromKeyframes(spec: TrackSpec): THREE.KeyframeTrack;
  ```
- **`tupleToVector3`** *(function)*

  ```ts
  function tupleToVector3(tuple: Vec3Tuple, out?: THREE.Vector3): THREE.Vector3;
  ```
- **`tweened`** *(function)* — Follow a numeric selection of controller state, easing every change.

  ```ts
  function tweened<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, { duration, easing, stiffness }?: TweenOptions): Tweened<V>;
  ```
- **`vector3ToTuple`** *(function)*

  ```ts
  function vector3ToTuple(v: THREE.Vector3): Vec3Tuple;
  ```
- **`vectorTrack`** *(function)*

  ```ts
  function vectorTrack(targetPath: string, times: number[], values: number[]): THREE.VectorKeyframeTrack;
  ```
- **`VoxelChunk`** *(class)*
- **`EASINGS`** *(const)*
- **`FORMAT_LOADERS`** *(const)*
- **`GradeShader`** *(const)*
- **`LIGHTING_PRESETS`** *(const)*
- **`MATERIAL_PRESETS`** *(const)*
- **`proceduralTextureCache`** *(const)*
- **`QUALITY_PRESETS`** *(const)*
- **`AnimationController`** *(interface)* — Wraps an AnimationMixer + its actions.
- **`App`** *(interface)*
- **`AppCameraOptions`** *(interface)*
- **`AppModule`** *(interface)* — A scene feature in the unidirectional flow.
- **`AppOptions`** *(interface)*
- **`Axis`** *(type)*
- **`BatchedBuildingsOptions`** *(interface)*
- **`BootstrapOptions`** *(interface)*
- **`BootstrappedScene`** *(interface)*
- **`BootstrapSetup`** *(type)*
- **`BootstrapSetupContext`** *(interface)*
- **`CameraBounds`** *(interface)*
- **`CameraController`** *(interface)*
- **`CameraControllerOptions`** *(interface)*
- **`CameraMode`** *(type)*
- **`CameraTarget`** *(interface)* — A serializable camera intent: where to stand and what to look at.
- **`ChunkBuilder`** *(type)*
- **`ChunkManager`** *(interface)*
- **`ChunkManagerOptions`** *(interface)*
- **`CinematicLutOptions`** *(interface)*
- **`Clock`** *(interface)* — A simulation time source.
- **`ClockMode`** *(type)*
- **`ClockOptions`** *(interface)*
- **`ColorCurve`** *(type)* — [t, color] stops; color as css string or [r,g,b] in 0..1.
- **`ComposerHandle`** *(interface)*
- **`ComposerOptions`** *(interface)*
- **`CompositePart`** *(interface)*
- **`ConnectionGraph`** *(interface)*
- **`ConnectionGraphOptions`** *(interface)*
- **`CreatePropOptions`** *(interface)*
- **`Disposable`** *(interface)* — Anything that owns GPU or DOM resources and must be torn down explicitly.
- **`DofPass`** *(interface)*
- **`DofPassOptions`** *(interface)*
- **`Easing`** *(type)*
- **`Emitter`** *(interface)*
- **`EmitterOptions`** *(interface)*
- **`EmitterShape`** *(type)*
- **`EnvironmentOptions`** *(interface)*
- **`ExtrudeAlongPathOptions`** *(interface)*
- **`ExtrudeOptions`** *(interface)*
- **`FilmGrainOptions`** *(interface)*
- **`FlyToOptions`** *(interface)*
- **`FollowCameraOptions`** *(interface)*
- **`FpsScaffold`** *(interface)*
- **`FpsScaffoldOptions`** *(interface)*
- **`FrameCallback`** *(type)*
- **`FrameContext`** *(interface)* — Per-frame context handed to every animated subsystem by the frame loop.
- **`FrameLoop`** *(interface)* — Self-contained Clock-driven frame loop.
- **`FrameLoopOptions`** *(interface)*
- **`GLTFLoaderOptions`** *(interface)*
- **`GodRaysPass`** *(interface)*
- **`GpuEmitterOptions`** *(type)*
- **`GradePass`** *(interface)*
- **`GradePassOptions`** *(interface)*
- **`GradientSkyOptions`** *(interface)*
- **`GridLayout`** *(interface)*
- **`HemisphereFillOptions`** *(interface)*
- **`HolographicMaterialOptions`** *(interface)*
- **`HudBeamOptions`** *(interface)*
- **`HudBeamTransition`** *(interface)*
- **`InfiniteGround`** *(interface)*
- **`InfiniteGroundOptions`** *(interface)*
- **`InstancedFieldOptions`** *(interface)*
- **`InstancedPropOptions`** *(interface)*
- **`InstancedPropResult`** *(interface)*
- **`InstancePlaceFn`** *(type)*
- **`InstancePlacement`** *(interface)*
- **`IsoCameraOptions`** *(interface)*
- **`IsoFlavor`** *(type)*
- **`IsoScaffold`** *(interface)*
- **`IsoScaffoldOptions`** *(interface)*
- **`LatheOptions`** *(interface)*
- **`LightConeOptions`** *(interface)*
- **`LightingConfig`** *(interface)*
- **`LightingPresetName`** *(type)*
- **`LightingRig`** *(interface)*
- **`LightingRigOptions`** *(interface)*
- **`LoadedModel`** *(interface)* — Normalized result of loading a model file (glTF and friends).
- **`MaterialPoolLike`** *(interface)* — Minimal structural type for a material pool, so {@link SceneContext} can.
- **`ModelCache`** *(interface)*
- **`ModelLoader`** *(type)*
- **`Noise3D`** *(interface)*
- **`NoiseDisplaceOptions`** *(interface)*
- **`NoiseTextureOptions`** *(interface)*
- **`OrbitScaffold`** *(interface)*
- **`OrbitScaffoldOptions`** *(interface)*
- **`OverlayHandle`** *(interface)*
- **`PaintFn`** *(type)*
- **`ParamSpec`** *(type)* — A parameter specification used to coerce config- or LLM-driven content.
- **`ParamSpecMap`** *(type)*
- **`ParamValue`** *(type)*
- **`ParticleEmitter`** *(interface)*
- **`ParticleEmitterOptions`** *(interface)*
- **`PathCamera`** *(interface)*
- **`PathCameraOptions`** *(interface)*
- **`PathCameraSource`** *(interface)*
- **`PathTubeOptions`** *(interface)*
- **`PickFilter`** *(type)*
- **`PickOptions`** *(interface)*
- **`PickResult`** *(interface)*
- **`PlaceFn`** *(type)*
- **`PlayOptions`** *(interface)*
- **`Point2`** *(type)*
- **`PointerGestureCallbacks`** *(interface)* — Unified pointer gesture callbacks.
- **`PointerGestureOptions`** *(interface)*
- **`PoissonDiskOptions`** *(interface)*
- **`PostEffectName`** *(type)*
- **`PostPipeline`** *(interface)*
- **`PostPipelineOptions`** *(interface)*
- **`ProceduralBody`** *(interface)*
- **`ProceduralBodySpec`** *(interface)*
- **`PropComposite`** *(interface)*
- **`PropContext`** *(interface)* — Minimal context a prop needs to build + animate itself.
- **`PropDefinition`** *(interface)* — Declarative description of a reusable prop: how to build its Object3D, plus.
- **`PropFactory`** *(type)*
- **`PropInstance`** *(interface)* — A live, mounted prop.
- **`PropRegistry`** *(interface)*
- **`QualityPreset`** *(interface)*
- **`QualitySettings`** *(interface)*
- **`QualityTier`** *(type)*
- **`RadialLayout`** *(interface)*
- **`RailsScaffold`** *(interface)*
- **`RailsScaffoldOptions`** *(interface)*
- **`Reducer`** *(type)*
- **`RendererOptions`** *(interface)*
- **`ResizeHandler`** *(type)*
- **`ScalarCurve`** *(type)* — [t, value] stops, t in 0..1 ascending.
- **`SceneContext`** *(interface)* — Context injected into every scene module.
- **`SceneEventBinding`** *(interface)*
- **`SceneEventHandlers`** *(interface)*
- **`SceneEvents`** *(interface)*
- **`SceneEventsOptions`** *(interface)*
- **`SceneModule`** *(interface)* — A self-contained scene feature.
- **`SceneModuleDefinition`** *(interface)*
- **`ScreenProjection`** *(interface)*
- **`SeededRng`** *(interface)* — Seeded pseudo-random stream.
- **`SegmentStream`** *(interface)*
- **`SegmentStreamOptions`** *(interface)*
- **`ShaderQuad`** *(interface)*
- **`ShaderQuadOptions`** *(interface)*
- **`Skybox`** *(interface)*
- **`SkyboxOptions`** *(interface)*
- **`SpawnSample`** *(interface)*
- **`StandardLighting`** *(interface)*
- **`StandardLightingOptions`** *(interface)*
- **`StandardPresetName`** *(type)*
- **`StateController`** *(interface)* — Read side of a store: the minimal contract scaffolds consume state through.
- **`StateSource`** *(type)* — What a scaffold accepts as its state input.
- **`StereoMode`** *(type)*
- **`StereoRenderer`** *(interface)*
- **`StereoSizeOptions`** *(interface)*
- **`Store`** *(interface)*
- **`StoreListener`** *(type)*
- **`StreamSegment`** *(interface)*
- **`StreamSegmentInput`** *(interface)*
- **`SunOptions`** *(interface)*
- **`TextureCache`** *(interface)*
- **`TickableMaterial`** *(interface)*
- **`ToonOptions`** *(interface)*
- **`TppScaffold`** *(interface)*
- **`TppScaffoldOptions`** *(interface)*
- **`TrackSpec`** *(interface)*
- **`Transform`** *(interface)*
- **`TransportFrames`** *(interface)*
- **`TriplanarMaterialOptions`** *(interface)*
- **`Tweened`** *(interface)*
- **`TweenOptions`** *(interface)*
- **`TweenValue`** *(type)* — Scalars and fixed-length numeric tuples — positions, scales, rgb colors.
- **`Vec3Tuple`** *(type)*
- **`ViewRegistry`** *(interface)*
- **`ViewRegistryOptions`** *(interface)*
- **`ViewRenderer`** *(interface)* — One "view" of the app (a whole sub-scene).
- **`VoxelVisitor`** *(type)*

  <details><summary>Example</summary>

  ```ts
  import { createApp, createIsoScaffold, createToonMaterial } from '@tuomashatakka/threejs-scenes'
  ```
  </details>

#### `@tuomashatakka/threejs-scenes/webgpu`

Experimental WebGPU/TSL node post-processing helpers isolated from the WebGL barrel so standard scenes never need to resolve three/webgpu.

- **`createAfterImage`** *(function)*

  ```ts
  function createAfterImage(input: ColorNode, options?: AfterImageOptions): import("three/addons/tsl/display/AfterImageNode.js").default;
  ```
- **`createAnamorphic`** *(function)*

  ```ts
  function createAnamorphic(input: ColorNode, options?: AnamorphicOptions): import("three/addons/tsl/display/AnamorphicNode.js").default;
  ```
- **`createAo`** *(function)*

  ```ts
  function createAo(viewZ: ColorNode, normal: ColorNode, camera: THREE.Camera): import("three/addons/tsl/display/GTAONode.js").default;
  ```
- **`createBloom`** *(function)*

  ```ts
  function createBloom(input: ColorNode, options?: BloomOptions): import("three/addons/tsl/display/BloomNode.js").default;
  ```
- **`createBloomEmissive`** *(function)*

  ```ts
  function createBloomEmissive(scenePass: PassNode, options?: BloomEmissiveOptions): {
  ```
- **`createBloomSelective`** *(function)*

  ```ts
  function createBloomSelective(scenePass: PassNode, options?: BloomSelectiveOptions): {
  ```
- **`createChromaticAberration`** *(function)*

  ```ts
  function createChromaticAberration(input: ColorNode, options?: ChromaticAberrationOptions): import("three/addons/tsl/display/ChromaticAberrationNode.js").default;
  ```
- **`createDifference`** *(function)*

  ```ts
  function createDifference(scenePass: PassNode, options?: DifferenceOptions): import("three/webgpu").Node<"vec3">;
  ```
- **`createDof`** *(function)*

  ```ts
  function createDof(input: ColorNode, viewZ: ColorNode, options?: DofOptions): import("three/addons/tsl/display/DepthOfFieldNode.js").default;
  ```
- **`createDofBasic`** *(function)*

  ```ts
  function createDofBasic(input: Node<'vec4'>, viewZ: Node<'float'>, options?: DofBasicOptions): Node<"vec4">;
  ```
- **`createFxaa`** *(function)*

  ```ts
  function createFxaa(input: ColorNode): import("three/addons/tsl/display/FXAANode.js").default;
  ```
- **`createGodrays`** *(function)*

  ```ts
  function createGodrays(depthNode: TextureNode, camera: Camera, light: DirectionalLight | PointLight, options?: GodraysOptions): import("three/addons/tsl/display/GodraysNode.js").default;
  ```
- **`createLensflare`** *(function)*

  ```ts
  function createLensflare(input: Node, options?: LensflareOptions): import("three/addons/tsl/display/LensflareNode.js").default;
  ```
- **`createLut`** *(function)*

  ```ts
  function createLut(input: ColorNode, options: LutOptions): import("three/addons/tsl/display/Lut3DNode.js").default;
  ```
- **`createMasking`** *(function)*

  ```ts
  function createMasking(base: Node<'vec4'>, camera: THREE.Camera, layers: MaskLayer[]): Node;
  ```
- **`createMotionBlur`** *(function)*

  ```ts
  function createMotionBlur(input: Node, velocityNode: Node, options?: MotionBlurOptions): Node<"vec4">;
  ```
- **`createOutline`** *(function)*

  ```ts
  function createOutline(scene: THREE.Scene, camera: THREE.Camera, options?: OutlineOptions): import("three/addons/tsl/display/OutlineNode.js").default;
  ```
- **`createPixelationPass`** *(function)*

  ```ts
  function createPixelationPass(scene: THREE.Scene, camera: THREE.Camera, options?: PixelOptions): import("three/addons/tsl/display/PixelationPassNode.js").default;
  ```
- **`createRadialBlur`** *(function)*

  ```ts
  function createRadialBlur(input: ColorNode, options?: RadialBlurOptions): import("three/webgpu").Node;
  ```
- **`createRenderPipeline`** *(function)*

  ```ts
  function createRenderPipeline(renderer: Renderer, outputNode: Node): RenderPipeline;
  ```
- **`createRetroPass`** *(function)*

  ```ts
  function createRetroPass(scene: THREE.Scene, camera: THREE.Camera, options?: RetroOptions): import("three/addons/tsl/display/RetroPassNode.js").default;
  ```
- **`createScenePass`** *(function)*

  ```ts
  function createScenePass(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
  ```
- **`createScenePassEmissive`** *(function)*

  ```ts
  function createScenePassEmissive(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createScenePassMRT`** *(function)*

  ```ts
  function createScenePassMRT(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
  ```
- **`createScenePassSSR`** *(function)*

  ```ts
  function createScenePassSSR(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createScenePassVelocity`** *(function)*

  ```ts
  function createScenePassVelocity(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
  ```
- **`createSmaa`** *(function)*

  ```ts
  function createSmaa(input: ColorNode): import("three/addons/tsl/display/SMAANode.js").SMAANode;
  ```
- **`createSobel`** *(function)*

  ```ts
  function createSobel(input: ColorNode): import("three/addons/tsl/display/SobelOperatorNode.js").default;
  ```
- **`createSsaaPass`** *(function)*

  ```ts
  function createSsaaPass(scene: THREE.Scene, camera: THREE.Camera, options?: SsaaOptions): import("three/addons/tsl/display/SSAAPassNode.js").default;
  ```
- **`createSsgi`** *(function)*

  ```ts
  function createSsgi(beautyNode: Node, depthNode: Node, normalNode: Node, camera: PerspectiveCamera, options?: SsgiOptions): import("three/addons/tsl/display/SSGINode.js").default;
  ```
- **`createSsr`** *(function)*

  ```ts
  function createSsr(colorNode: Node, depthNode: Node, normalNode: Node, metalness: Node, roughness: Node, camera: Camera, options?: SsrOptions): import("three/addons/tsl/display/SSRNode.js").default;
  ```
- **`createSss`** *(function)*

  ```ts
  function createSss(depthNode: TextureNode, camera: Camera, mainLight: DirectionalLight, options?: SssOptions): import("three/addons/tsl/display/SSSNode.js").default;
  ```
- **`createTraa`** *(function)*

  ```ts
  function createTraa(beautyNode: Node, depthNode: TextureNode, velocityNode: TextureNode, camera: Camera, options?: TraaOptions): import("three/addons/tsl/display/TRAANode.js").default;
  ```
- **`createTransition`** *(function)*

  ```ts
  function createTransition(passA: Node, passB: Node, mixTexture: Node, options?: TransitionOptions): import("three/addons/tsl/display/TransitionNode.js").default;
  ```
- **`createPostProcessing`** *(const)*
- **`AfterImageOptions`** *(interface)*
- **`AnamorphicOptions`** *(interface)*
- **`BloomEmissiveOptions`** *(interface)*
- **`BloomOptions`** *(interface)*
- **`BloomSelectiveOptions`** *(interface)*
- **`ChromaticAberrationOptions`** *(interface)*
- **`ColorEffect`** *(type)*
- **`ColorNode`** *(type)*
- **`DifferenceOptions`** *(interface)*
- **`DofBasicOptions`** *(interface)*
- **`DofOptions`** *(interface)*
- **`GodraysOptions`** *(interface)*
- **`LensflareOptions`** *(interface)*
- **`LutOptions`** *(interface)*
- **`MaskLayer`** *(interface)*
- **`MotionBlurOptions`** *(interface)*
- **`OutlineOptions`** *(type)*
- **`PixelOptions`** *(interface)*
- **`RadialBlurOptions`** *(interface)*
- **`RetroOptions`** *(interface)*
- **`ScenePassTargets`** *(interface)*
- **`SsaaOptions`** *(interface)*
- **`SsgiOptions`** *(interface)*
- **`SsrOptions`** *(interface)*
- **`SssOptions`** *(interface)*
- **`TraaOptions`** *(interface)*
- **`TransitionOptions`** *(interface)*

  <details><summary>Example</summary>

  ```ts
  import * as webgpuPost from '@tuomashatakka/threejs-scenes/webgpu'
  ```
  </details>

#### `@tuomashatakka/threejs-scenes/jsx`

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
- **`jsx`** *(function)*

  ```ts
  function jsx(type: ElementType, props: Record<string, unknown> | null): SceneElement;
  ```
- **`mountTree`** *(function)* — Mount a tree under the runtime's scene.

  ```ts
  function mountTree(root: SceneChild, rt: Runtime): void;
  ```
- **`render`** *(function)*

  ```ts
  function render(root: SceneChild, options: RenderOptions): RenderHandle;
  ```
- **`signal`** *(function)*

  ```ts
  function signal<T>(initial: T): [Accessor<T>, Setter<T>];
  ```
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
- **`Fragment`** *(const)*
- **`jsxDEV`** *(const)*
- **`jsxs`** *(const)*
- **`useDerived`** *(const)* — Computed reactive value derived from other accessors.
- **`useSignal`** *(const)* — Reactive state: const [count, setCount] = useSignal(0).
- **`Accessor`** *(type)*
- **`CameraProps`** *(interface)*
- **`ComponentFn`** *(type)*
- **`ElementType`** *(type)*
- **`Host`** *(interface)*
- **`InstancesProps`** *(interface)*
- **`LightProps`** *(interface)*
- **`MeshProps`** *(interface)*
- **`PostProps`** *(interface)*
- **`PrimitiveProps`** *(interface)*
- **`PropProps`** *(interface)*
- **`ReactiveBinding`** *(interface)*
- **`RenderHandle`** *(interface)*
- **`RenderOptions`** *(interface)*
- **`Runtime`** *(interface)*
- **`SceneChild`** *(type)*
- **`SceneElement`** *(interface)*
- **`SceneProps`** *(interface)*
- **`Setter`** *(type)*

  <details><summary>Example</summary>

  ```ts
  import { render, h, signal } from '@tuomashatakka/threejs-scenes/jsx'
  ```
  </details>

#### `@tuomashatakka/threejs-scenes/jsx/jsx-runtime`

The jsx/jsxs/Fragment runtime target for tsconfig jsxImportSource plus the hyperscript helper used by no-build demos.

- **`h`** *(function)* — Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed.

  ```ts
  function h(type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement;
  ```
- **`jsx`** *(function)*

  ```ts
  function jsx(type: ElementType, props: Record<string, unknown> | null): SceneElement;
  ```
- **`Fragment`** *(const)*
- **`jsxDEV`** *(const)*
- **`jsxs`** *(const)*
- **`ComponentFn`** *(type)*
- **`ElementType`** *(type)*
- **`SceneChild`** *(type)*
- **`SceneElement`** *(interface)*

  <details><summary>Example</summary>

  ```ts
  import { jsx, jsxs, Fragment } from '@tuomashatakka/threejs-scenes/jsx/jsx-runtime'
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
import * as webgpuPost from '@tuomashatakka/threejs-scenes/webgpu'

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
