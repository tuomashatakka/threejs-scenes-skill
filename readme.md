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

Tree-shakeable subpaths are exported too: `threejs-scenes/core`,
`/camera`, `/instancing`, `/materials`, `/lighting`, `/particles`, `/post`,
`/procedural`, `/voxels`, `/architecture`, `/types`.

### main factories

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

The frame loop is **self-contained** (a `THREE.Clock`-driven `requestAnimationFrame`
with `registerUpdate` / `unregisterUpdate`) so the package has no exotic
dependencies. The LLM codegen module (`scripts/llm-functions.js`) is **not**
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
import { webgpuPost } from 'threejs-scenes'
// or: import * as webgpuPost from 'threejs-scenes/post/webgpu'

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
