# Scripts Index

Each script is a self-contained ES module. They share these conventions:

- `import * as THREE from 'three'` at the top.
- Imports from `three/addons/` resolve via importmap when used in an artifact.
- Named exports only (no default exports).
- A `// perf:` annotation at the bottom describing cost class.
- Module-scope scratch objects to avoid per-frame allocations.

When adapting for live artifacts, replace bare specifiers (`three`,
`three/addons/...`) with esm.sh URLs or wire an importmap. See `SKILL.md`
section "Embedding Scripts in Live Artifacts".

## Foundation

| Script | Purpose | Reference |
|--------|---------|-----------|
| `frame-loop.js` | Singleton render-loop adapter for `@tuomashatakka/canvas-loop-framecapper`. Drives every animated subsystem via `onFrame(cb)`. | `project-architecture.md` |
| `renderer-setup.js` | `WebGLRenderer` factory with sane defaults + `ResizeObserver` attachment helper. | `project-architecture.md` |
| `scene-bootstrap.js` | Minimal end-to-end scene wiring. Copy as starting point for any new scene. | `project-architecture.md` |
| `pointer-gesture.js` | Unified pointer handler — drag, pinch, wheel, tap. Mouse/touch/pen identical. | `camera-handling.md` |
| `rng.js` | Seeded RNG (`mulberry32`) + hash/lerp/smoothstep helpers. | `programmatic-generation.md` |
| `dispose-scene.js` | Recursive scene cleanup. Disposes geometries, materials, textures, render targets. | `performance.md` |
| `quality-tier.js` | Device-tier detection + per-tier preset configs (shadows, post-fx, chunks, particles). | `performance.md` |

## Camera

| Script | Purpose | Reference |
|--------|---------|-----------|
| `iso-camera.js` | Isometric `OrthographicCamera` factory (true-iso or dimetric) + resize helper. | `isometric-and-infinite-scenes.md` |
| `follow-camera.js` | Critically-damped third-person follow with framerate-independent lerp. | `camera-handling.md` |

## Geometry & Instancing

| Script | Purpose | Reference |
|--------|---------|-----------|
| `procedural-crystal-geometry.js` | Programmatic geometry — crystal-shard cluster. Template for any procedural BufferGeometry. | `programmatic-generation.md` |
| `instancing-grass.js` | `InstancedMesh` field — 1 draw call for N copies of one geometry. | `instancing.md` |
| `batched-buildings.js` | `BatchedMesh` — 1 draw call for N varied geometries sharing one material. | `instancing.md` |
| `poisson-disk.js` | Poisson disk 2D sampling for natural placement (forests, asteroids). | `programmatic-generation.md` |

## Voxels

| Script | Purpose | Reference |
|--------|---------|-----------|
| `voxel-data.js` | `VoxelChunk` class — flat `Uint16Array` storage with bounds-checked accessors. | `voxel-geometry.md` |
| `greedy-mesh.js` | Greedy voxel meshing. Reduces face count 10–30× vs naive 6-quads-per-cell. | `voxel-geometry.md` |

## Infinite Scenes

| Script | Purpose | Reference |
|--------|---------|-----------|
| `chunk-manager.js` | Pooled chunk loader for infinite worlds. Origin rebasing avoids float32 precision rot. | `isometric-and-infinite-scenes.md` |

## Textures

| Script | Purpose | Reference |
|--------|---------|-----------|
| `noise-texture.js` | Seamless tileable noise as `DataTexture` via toroidal simplex noise sampling. | `textures-and-maps.md` |
| `glyph-atlas.js` | Sprite atlas of text glyphs via `OffscreenCanvas`. Returns `CanvasTexture` + UV lookup. | `textures-and-maps.md` |

## Materials & Shaders

| Script | Purpose | Reference |
|--------|---------|-----------|
| `holographic-material.js` | Example `ShaderMaterial` with fresnel rim, scanlines, animated noise. Template for any custom shader. | `shaders.md` |

## Lighting

| Script | Purpose | Reference |
|--------|---------|-----------|
| `lighting-setup.js` | Standard scene lighting — IBL env + sun + hemisphere fill. Tuned shadow frustum. | `lighting.md` |

## Particles

| Script | Purpose | Reference |
|--------|---------|-----------|
| `cpu-particles.js` | CPU-driven instanced particle system. 10k–50k particles with custom physics. | `particles.md` |

## Billboards

| Script | Purpose | Reference |
|--------|---------|-----------|
| `sprite-batch.js` | GLSL-billboarded `InstancedMesh`. 1 draw call for 100k+ camera-facing quads. | `billboards.md` |

## Post-Processing

| Script | Purpose | Reference |
|--------|---------|-----------|
| `composer-setup.js` | `EffectComposer` factory with `DepthTexture` and bloom pre-wired. | `post-processing.md` |
| `glitch-passes.js` | Three glitch variants: RGB shift, block displacement, scan corruption. Stackable. | `post-processing.md` |
| `god-rays-pass.js` | Screen-space radial blur from light position. Light auto-projected each frame. | `post-processing.md` |
| `dof-chromatic-pass.js` | Depth-of-field + chromatic aberration in one pass. Configurable focal point. | `post-processing.md` |
| `film-grain-pass.js` | Procedural per-fragment grain with luma toggle and optional desaturation. | `post-processing.md` |
| `hud-beam-transition.js` | Horizontal beam phase-in with midpoint callback for content swap. | `post-processing.md` |
| `stereoscopy.js` | Anaglyph + side-by-side stereo render wrappers. | `post-processing.md` |

## LLM Codegen

| Script | Purpose | Reference |
|--------|---------|-----------|
| `llm-functions.js` | Six ai-sdk tool schemas (zod) for Gemini-driven scene generation. | `llm-function-definitions.md` |
| `codegen-runner.js` | CLI runner that calls a named tool, validates output, writes JSON + meta. | `llm-function-definitions.md` |

## Dependency Map

Scripts that import other scripts in this folder:

- `scene-bootstrap.js` → `renderer-setup.js`, `frame-loop.js`, `pointer-gesture.js`, `lighting-setup.js`, `dispose-scene.js`
- `chunk-manager.js` → (none)
- `instancing-grass.js` → `rng.js`
- `procedural-crystal-geometry.js` → `rng.js`
- `noise-texture.js` → `rng.js` (`simplex-noise` external)
- `cpu-particles.js` → `rng.js`
- `greedy-mesh.js` → (consumes `VoxelChunk` from `voxel-data.js`)
- `frame-loop.js` → `@tuomashatakka/canvas-loop-framecapper`
- `llm-functions.js` → `ai`, `@ai-sdk/google`, `zod`
- `codegen-runner.js` → `llm-functions.js`

## Adapting for Artifacts

In a live artifact (single HTML file in an iframe sandbox), copy the script
bodies into a single `<script type="module">` block, drop the import lines,
and add an importmap that resolves `three` and `three/addons/`. See the
`SKILL.md` "Embedding Scripts in Live Artifacts" section for the full
pattern with three template options.

`@tuomashatakka/canvas-loop-framecapper` is a small (~150 LOC) module — for
artifacts you can either install it via `https://esm.sh/@tuomashatakka/canvas-loop-framecapper`
(if published) or inline its source (the `FrameLoopManager` class).

## Reading Order

If you're new to this skill, read in this order:

1. `frame-loop.js` — the heartbeat
2. `renderer-setup.js` + `scene-bootstrap.js` — putting a triangle on screen
3. `pointer-gesture.js` — input
4. `lighting-setup.js` — making it look like something
5. `instancing-grass.js` — your first performance win
6. `holographic-material.js` — your first custom shader
7. `composer-setup.js` + one pass — your first post-fx

After that, branch into voxels, infinite scenes, or LLM codegen based on the
project.
