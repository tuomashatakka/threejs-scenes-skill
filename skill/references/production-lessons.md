# Production Lessons

Hard-won patterns distilled from a shipping three.js project (`scene/` — an
AI-driven procedural scene generator with a headless screenshot/codegen
pipeline). Read this when architecting anything beyond a single demo: it
captures the conventions that keep a multi-module scene maintainable,
deterministic, and leak-free.

## Architecture

- **Context injection, not globals.** Every scene module is a factory returning
  `{ name, build(context), dispose() }`. `context` (`SceneContext`) carries
  `{ scene, camera, renderer, ground, rng, materials, models, loop }`. Modules
  never reach for globals — this kills init-order bugs and makes modules
  testable headless. Mirrors `scene-bootstrap.js`'s `onSetup({ scene, camera, renderer })`.
- **One frame loop, register/unregister.** Modules call `loop.registerUpdate(fn)`
  in `build()` and `loop.unregisterUpdate(fn)` in `dispose()`. A single `tick()`
  drives every animated subsystem. Never start a second `requestAnimationFrame`.
- **Metadata tagging for introspection.** Tag top-level objects with
  `obj.userData.module = name` when adding them. A click-to-inspect raycaster can
  then walk `object.parent` up to the scene-direct child and map a hit back to
  its owning module — no separate registry needed.
- **Lazy resource building.** EffectComposer, texture libraries, and model loaders
  build on first use, not at import. Keeps cold-start cheap and makes post-fx opt-in.

## Determinism

- **Seed once, fork per consumer.** A root `mulberry32(seed)` is forked per module
  via `rng.fork(label)` (label-hashed state). Same seed + same module label ⇒
  pixel-identical output regardless of build order or undo/redo replay. Essential
  for reproducible nightly screenshots and regression diffs.
- **Procedural detail over assets.** Surface variation comes from `CanvasTexture`
  painted with seeded noise (grass blades, wood grain, stone mottle), not image
  files. Detail maps are near-white luminance (≈1.0) so `paletteColor × detail`
  preserves saturation — the texture adds grain, not colour. Zero network assets,
  tiny memory, deterministic.

## Disposal — the #1 footgun

- **Dispose only what you OWN.** Pooled/shared materials are NEVER disposed —
  disposing a shared `MeshStandardMaterial` nukes every mesh referencing it.
  A module disposes the geometry *it* created and leaves library/shared
  materials and geometry untouched.
- **Track shared ownership with a Set.** When an assembly reuses geometry across
  mirrored twins, dedupe disposal through a `Set<object>` so you never
  double-dispose.
- **Mixers need `uncacheRoot`.** `AnimationMixer.stopAllAction()` then
  `mixer.uncacheRoot(model)` on teardown, or clip caches leak.

## Performance

- **Draw-call budget is real.** Many mobile tilers and the project's own CI gate
  choke past ~96–100 draw calls. Default to `InstancedMesh` (one geometry, many
  matrices) or `BatchedMesh` (varied geometries, one material) before adding a
  second `Mesh`. Recompose, don't accumulate.
- **Flat-shaded low-poly.** `flatShading: true` + low segment counts (a cone at
  `radialSegments: 6`, not 32). Detail comes from form and texture, not smooth
  curvature — cheaper geometry, distinctive look, and flat materials pool cleanly.
- **No per-frame allocation.** Particle systems use deterministic phase math
  (`age = (elapsed * speed + seedPhase) % 1`) instead of birth/death lists —
  zero garbage. Keep module-scope scratch `Object3D` / `Color` / `Vector3`;
  never `new` inside the loop.
- **Bounding volumes once.** `computeBoundingBox()` + `computeBoundingSphere()`
  at finalize time; frustum culling needs the sphere.

## Post-Processing

- **Chain order:** `RenderPass → UnrealBloomPass → ShaderPass(grade) → OutputPass`.
- **Grade in linear HDR**, before tone-mapping. Tint, contrast (around mid-grey),
  saturation, soft radial vignette, seeded grain, and radial chromatic aberration
  (`split ∝ dot(centerOffset, centerOffset)` so it grows toward the corners) all
  run scene-referred.
- **Tone-map exactly once, at `OutputPass`.** If a composer is active, do NOT also
  set `renderer.toneMapping` — you'll double-correct. Keep one composer per scene,
  built lazily, re-tuned idempotently.

## Robustness / Headless

- **DOM-guard procedural textures.** `if (typeof document === 'undefined') return null`
  so a headless test/codegen runner degrades to flat colour instead of crashing.
- **Asset loaders never crash the scene.** A missing/malformed GLB returns an empty
  instance; modules fall back to procedural stand-ins. Per-asset try/catch, warn,
  continue.
- **`window.__SCENE_READY__` capture signal.** Set it `true` after first
  `compile()` + setup. Headless capture (Playwright + Chromium with
  `--use-angle=swiftshader` for CPU-only/GPU-less CI) waits on this flag rather
  than a hardcoded delay — handles fade-ins and async model loads correctly.

## Registry / Param Coercion (for config- or LLM-driven content)

- **`as const satisfies Record<...>` registries** (bases, modifiers, palettes,
  presets) give type inference + exhaustiveness checks.
- **Coerce, never throw.** `resolveParams(spec, given)` clamps numbers to
  `[min, max]`, validates enums against their option list, and falls back to the
  default for anything malformed. LLM-emitted JSON with a bad knob degrades to a
  sane default instead of exploding.
- **Repair before the gate.** When generating code with an LLM, run deterministic
  codemods (fix import depth, remap invented palette names, strip disposal of
  pooled materials, prefix unused params with `_`) BEFORE the typecheck/build gate.
  The compiler is the final judge; idempotent codemods absorb the model's recurring
  mistakes without retraining.
- **Snapshot/restore transactions.** Before applying generated edits, snapshot the
  touched files; on verify failure, restore atomically so no broken partial output
  escapes.
