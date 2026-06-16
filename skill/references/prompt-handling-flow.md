# Prompt Handling Flow

How to classify a user request and route it to the right primitives.

## Classification

Every incoming user prompt gets classified into one of:

- `geometry`
- `shader`
- `material`
- `instance-placement`
- `texture`
- `camera`
- `effect-pass`
- `particle-system`
- `lighting`
- `scene-composition`
- `voxel-world`
- `infinite-scene`
- `optimization`
- `debug`

Classification drives which factory templates and LLM tool schemas to invoke.

## Flow

1. **Read state.** Before generating code, inspect `src/scene/`, `src/materials/`,
   `src/post/passes/` for existing primitives. Reuse and extend; never duplicate.

2. **Classify + scope.** Decide if the request is a single new module, an
   extension of an existing one, or a cross-cutting refactor. Ask one
   clarifying question only when scope is genuinely ambiguous.

3. **Decide: hand-author vs. LLM-generate.**
   - Anything below ~20 data points or requiring strict performance contracts
     → hand-author.
   - Anything procedural with config-driven outputs (palettes, transforms,
     noise variants, decoration placement, voxel level layouts, shader
     variations) → LLM-generate via the function tools in
     `references/llm-function-definitions.md`, then validate.

4. **Plan as factory + options.** Every new module exposes one factory with
   a typed options object and a single default config. Avoid prop drilling
   — pass the whole options object down.

5. **Generate, format, dispose.** Emit code, run `eslint --fix`, add a
   cleanup function paired with allocation. Ship a usage snippet integrated
   into `create-scene.js`.

6. **Validate.** For shader-heavy outputs, compile-check by instantiating in
   a node script with three.js headless before claiming done. For geometry,
   log `geometry.attributes.position.count` and `BoundingSphere.radius` to
   confirm sanity.

7. **Annotate perf class.** Every delivered module ends with a `// perf:`
   comment noting expected draw calls, fragment cost class
   (cheap / medium / expensive), and memory footprint.

## Decision Tree by User Phrase

| User says… | Load reference | Use script |
|------------|---------------|-----------|
| "make a 3D scene of X" | `core-principles.md` + `project-architecture.md` | `scene-bootstrap.js` |
| "isometric game" | `isometric-and-infinite-scenes.md` | `iso-camera.js` |
| "infinite scroll" / "endless terrain" | `isometric-and-infinite-scenes.md` | `chunk-manager.js` |
| "voxel" / "minecraft-like" | `voxel-geometry.md` | `voxel-data.js` + `greedy-mesh.js` |
| "thousands of trees / grass / asteroids" | `instancing.md` + `billboards.md` | `instancing-grass.js` + `sprite-batch.js` |
| "many different objects same material" | `instancing.md` | `batched-buildings.js` |
| "glitch effect" / "datamosh" / "VHS" | `post-processing.md` | `glitch-passes.js` |
| "bloom" / "glow" | `post-processing.md` | `composer-setup.js` |
| "god rays" / "light shafts" | `post-processing.md` | `god-rays-pass.js` |
| "depth of field" / "DOF" / "blur background" | `post-processing.md` | `dof-chromatic-pass.js` |
| "chromatic aberration" | `post-processing.md` | `dof-chromatic-pass.js` |
| "3D glasses" / "anaglyph" / "VR cardboard" | `post-processing.md` | `stereoscopy.js` |
| "film grain" / "retro look" | `post-processing.md` | `film-grain-pass.js` |
| "HUD transition" / "beam sweep" | `post-processing.md` | `hud-beam-transition.js` |
| "follow camera" / "3rd-person cam" | `camera-handling.md` | `follow-camera.js` |
| "touch controls" / "mobile gestures" | `camera-handling.md` | `pointer-gesture.js` |
| "particles" / "sparks" / "smoke" | `particles.md` | `cpu-particles.js` |
| "billboard" / "always faces camera" | `billboards.md` | `sprite-batch.js` |
| "holographic" / "scifi material" | `shaders.md` | `holographic-material.js` |
| "procedural texture" / "noise pattern" | `textures-and-maps.md` + `programmatic-generation.md` | `noise-texture.js` |
| "running slow on mobile" | `performance.md` | — |
| "generate scene from text" / "AI-generated 3D" | `llm-function-definitions.md` | `llm-functions.js` + `codegen-runner.js` |

## Codegen Strategy

When batch-creating modules or data, write a Node script (e.g.
`src/llm/codegen/<task>.js`) that:

1. Reads scene config (`src/config/scene.config.js`).
2. Calls the LLM with one of the function-tool schemas from
   `references/llm-function-definitions.md`.
3. Validates the response against a `zod` schema.
4. Writes JavaScript output to disk.
5. Re-runs `eslint --fix` on the output.

This keeps the codebase deterministic and auditable — the same prompt + seed
regenerates the same file.

## Determinism

Every LLM-generated artifact MUST embed:

- The prompt that produced it.
- The seed used for any RNG.
- The model id and schema version.

Store as a comment header in the emitted file and as a sibling `.meta.json`.
Makes regenerations diffable and reviewable.

## Clarification Threshold

Ask at most one clarifying question before generating. Acceptable triggers:

- The user said "make a 3D scene" with no theme, no purpose, no count, no
  style.
- The user requested a "shader" without specifying base material or visual
  target.

Don't ask:

- Whether the user wants three.js (they invoked the skill).
- Whether they want WebGL (this skill is WebGL only).
- For a perfect spec — guess plausible defaults and ship a working starting
  point. Iteration is cheaper than waiting.

## Delivery Contract

Every code answer includes:

1. A complete, typed, ESLint-clean module.
2. Clear file-path comments at the top.
3. A usage snippet integrating into the scene.
4. Cleanup / disposal where lifecycle warrants.
5. A `// perf:` annotation noting draw calls, fragment-cost class, and
   memory footprint when nontrivial.
6. For LLM-codegen tasks: the function tool used, the seed, and the model id.
