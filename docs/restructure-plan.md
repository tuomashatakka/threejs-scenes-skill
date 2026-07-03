# Plan: concise package contents & meaningful submodule exports

Status: **phases P0–P2 implemented in 1.6.0** — facade subpaths
`/primitives` `/raster` `/compose` `/view`, the `/state` layer (controller
protocol + `tweened`/`lerpOnChange`), all five `/scaffold/*` genre scaffolds,
and the curated `/main` barrel, all as re-export facades over the existing
folders with zero breaking changes. Remaining: P3 (physical moves + curated
root as default, v2.0.0) and P4 (shim removal, v3.0.0).

## Problem

The package currently exposes 18 subpaths that mirror the internal folder layout
(`core`, `camera`, `instancing`, `materials`, `geometry`, `loaders`, `animation`,
`props`, `lighting`, `particles`, `post`, `post/webgl`, `post/webgpu`, `procedural`,
`voxels`, `architecture`, `jsx`, `types`), and the root barrel `export *`s almost
all of them (~200 named exports). Consumers face three problems:

1. **No conceptual grouping** — "where does raycasting live?" (`architecture`),
   "where is the noise texture?" (`procedural`, not `materials`) requires knowing
   the repo history, not the domain.
2. **Bloated surface** — the root barrel re-exports everything, so docs, editor
   completion, and `d.ts` payloads are flat lists of 200 symbols.
3. **No high-level entry point** — every app re-wires renderer + camera + lighting
   + post + input by hand; `createApp` helps but still leaves genre-level wiring
   (an isometric game, a third-person sim) to the consumer.

## Proposed export map

Five domain submodules plus scaffolds, ordered by data flow (state flows strictly
downward, left to right):

```
state ──▶ scaffold ──▶ compose ──▶ primitives
                │          │
                ▼          ▼
              view       raster
```

### `threejs-scenes/primitives` — things you can put in a scene

Textures, materials, geometry and mesh manipulation/construction.

| Moves here | From |
| --- | --- |
| shapes, extrude, lathe, modifiers, merge, path-tube | `geometry` |
| material presets, holographic, triplanar, shader-quad | `materials` |
| noise, noise-texture, rng, poisson-disk, procedural body | `procedural` |
| instanced-field, batched-buildings | `instancing` |
| voxel-data, greedy-mesh | `voxels` |
| connection-graph, infinite-ground | `geometry` |

Deterministic construction stays a core guarantee: everything that takes a seed
keeps taking a seed.

### `threejs-scenes/raster` — how the scene turns into pixels

Lighting, color correction, post-processing, cameras — and particles/emitters
(they are render-technique-bound: billboards, GPGPU, blending).

| Moves here | From |
| --- | --- |
| lighting rig, light-cone, lighting presets | `lighting` |
| composer, pipeline, all WebGL passes, grade/LUT color correction | `post`, `post/webgl` |
| WebGPU/TSL effects (kept off the barrel, as today) | `post/webgpu` → `raster/webgpu` |
| camera-controller, iso-camera, follow-camera, path-camera, targets | `camera` |
| emitter, gpu-emitter, curves (drop deprecated v1 `cpu-particles`) | `particles` |

### `threejs-scenes/compose` — assembling and interacting with a scene

Scene management, grouping, props, skyboxing, raycasting, event handler binding.

| Moves here | From |
| --- | --- |
| scene-module, view-registry, material-pool, edit-stack, param-coercion | `architecture` |
| pick, click-guard (raycasting + interaction discrimination) | `architecture` |
| prop, instanced-prop, composite, prop registry | `props` |
| gltf loader, model-registry | `loaders` |
| group, layoutGrid/Radial/Stack | `geometry` |
| animation controller, programmatic clips | `animation` |
| **new:** `createSkybox` (cube/equirect/procedural-gradient) | — |
| **new:** `bindSceneEvents` — declarative pointer-event → raycast-target binding | — |

### `threejs-scenes/view` — binding to the DOM and the frame loop

Canvas binding, renderer, animation-frame loop, input plumbing.

| Moves here | From |
| --- | --- |
| renderer, frame-loop, clock, scene-bootstrap, overlay, projection | `core` |
| pointer-gesture (raw DOM input; `compose` consumes its events) | `core` |
| dispose, quality tiers | `core` |

### `threejs-scenes/state` — unidirectional data flow (new)

The store already exists (`core/state.ts`); this makes it a first-class layer:

- `createStore` / reducer `dispatch` / subscribers (moved from `core`).
- **Controller protocol**: anything with `{ get(): S, subscribe(fn): unsubscribe }`
  is accepted wherever a store is — a plain object is wrapped in a read-only
  static store, so scaffolds can "receive an object or a state or a controller".
- **Transitions**: `tweened(store, key, { duration, easing })` and
  `lerpOnChange(selector, apply)` helpers so numeric/vector/color state changes
  interpolate over frames instead of snapping. Discrete keys apply immediately.
  Implementation reuses the exp-damping already proven in `follow-camera` and
  `camera-controller`; camera `targets` tuples are the reference pattern.
- Data flows one way: input/UI writes the store → scaffold passes state down →
  modules project state onto scene objects in `update()`. Nothing in the scene
  graph writes back to the store.

### `threejs-scenes/scaffold` — high-level genre scaffolding (new)

Submodules under `scaffold/*`, each a one-call wiring of the other layers that
accepts `(canvas, stateSource, options)` and returns the `createApp` handle:

| Subpath | Wires up |
| --- | --- |
| `scaffold/iso` | orthographic iso camera + pan/zoom gestures + infinite ground / chunk manager + pick-to-tile events — isometric games & builders |
| `scaffold/fps` | pointer-lock look + WASD intent → state + collision hook + perspective camera — first-person sims |
| `scaffold/tpp` | follow-camera + character controller intent + obstacle-fade hook — third-person games |
| `scaffold/orbit` | orbit/viewer camera + standard lighting + composer preset — product/model viewers |
| `scaffold/rails` | segment-stream + path-camera + endless world rebasing — on-rails cinematics (exists as `procedural/segment-stream` + `camera/path-camera`) |

`createApp` (from `core`) becomes the shared runtime under all scaffolds; `jsx`
stays its own subpath and gains intrinsics for scaffolds (`<iso>`, `<orbit>`)
in a later minor.

### Kept as-is

- `threejs-scenes/jsx` and `jsx/jsx-runtime` (transpile target path must stay stable).
- `threejs-scenes/types` for shared type-only imports.
- Root import `threejs-scenes` remains, but becomes **curated**: it re-exports the
  six submodule namespaces (`primitives`, `raster`, `compose`, `view`, `state`,
  `scaffold`) plus the ~20 most-used symbols (`createApp`, `bootstrapScene`,
  `createRenderer`, `createEmitter`, `createStandardMaterial`, …) instead of
  `export *` of everything.

## Conciseness measures

1. **Explicit barrels** — replace every `export * from` with named export lists;
   internals (scratch helpers, pass base classes, `types.ts` grab-bag) stop
   leaking. Target: root surface ≤ 30 symbols, each submodule ≤ 40.
2. **Delete deprecated code** — `createParticleEmitter` (v1), legacy module-global
   prop registry / model cache (superseded by `createPropRegistry` /
   `createModelCache`).
3. **Slimmer publish** — drop `*.js.map`/`*.d.ts.map` from the npm tarball
   (`files` already scopes to `dist`; add `!dist/**/*.map`), keep maps only in
   the Pages copy for demo debugging. Move `eslint` out of `dependencies` (it is
   a dev tool; shipping it forces it on every consumer).
4. **One doc per submodule** — `generate-docs.ts` groups the API reference by the
   six submodules, mirroring the skill reference files.

## Compatibility & migration

- **1.x (non-breaking):** new subpaths are pure re-export facades over the current
  folders — `primitives/index.ts` just re-exports from `../geometry`, `../materials`,
  etc. Old subpaths keep working untouched. Ship as **1.6.0**.
- **2.0.0:** files physically move to the new folders; old subpaths (`/core`,
  `/geometry`, …) become thin deprecated shims (`export * from '../view'` with
  `@deprecated` JSDoc) so imports keep resolving. Root barrel switches to the
  curated surface — this is the breaking change (symbols vanish from the root).
- **3.0.0:** remove the shims.
- Migration table published in the readme (`old import → new import`, one line per
  current subpath); skill references, templates, demos and `public/api.html`
  regenerate against the new layout in the same PR as the 2.0 flip.

## Phasing

| Phase | Deliverable | Release |
| --- | --- | --- |
| P0 | facade subpaths `primitives` / `raster` / `compose` / `view` (re-export only) + curated root barrel *added* as `threejs-scenes/main` for trial | 1.6.0 |
| P1 | `state` layer: controller protocol + `tweened` / `lerpOnChange` transitions; `createApp` accepts any state source | 1.7.0 |
| P2 | `scaffold/iso` + `scaffold/orbit` (the two with all ingredients already in-lib), then `scaffold/tpp`, `scaffold/rails`, `scaffold/fps` | 1.8.x |
| P3 | physical file moves, curated root becomes the default, deprecated shims, docs/skill/demo regeneration | 2.0.0 |
| P4 | delete shims + deprecated APIs | 3.0.0 |

Each phase keeps `bun run test` (typecheck + smoke) green and every Pages demo
running; the smoke test gains an import-map assertion that every published
subpath resolves.
