# Core Principles

The non-negotiable rules that apply to every three.js scene under this skill.

## Stack

- **Vanilla three.js only** — `import * as THREE from 'three'`. No React Three Fiber,
  no Drei, no JSX scene definitions. If a React app needs a canvas, mount three.js
  imperatively inside `useEffect` and let three.js own the loop.
- **WebGL2 via `WebGLRenderer`**. No WebGPU in this skill.
- **GLSL ES 3.00** shaders via `ShaderMaterial` / `RawShaderMaterial`. No TSL,
  no node materials.
- **Three.js r156+** for `BatchedMesh` support; r170+ recommended for stability.

## Programming Style

- **Functional + modular**. Pure factory functions per concern (`createRenderer`,
  `createScene`, `createGrassField`). No classes unless extending a three.js base
  type or modeling a clear stateful entity (e.g. `VoxelChunk`).
- **One symbol per file** unless co-located subcomponents share a tightly-coupled
  lifecycle.
- **Lowercase-dashes directories** (`scene/grass-field/`, `materials/holographic/`).
- **Default export** only when the file exports a single React component or a single
  class. Otherwise named exports.
- **Typed options object** as every factory's single argument, with defaults in the
  destructure.

## Performance Discipline

- **Programmatic generation > static data.** Geometry, textures, particle attribute
  buffers, palettes, and instance transforms are generated at runtime from typed
  arrays, noise functions, or seeded RNGs. Hand-typing more than ~20 entries is a
  code smell.
- **Mutate, don't reallocate.** Inside the render loop, reuse module-scope scratch
  `Vector3` / `Matrix4` / `Quaternion` / `Color` instances. Never `new` per frame.
- **Share materials, share geometries.** A new `MeshStandardMaterial` per mesh
  defeats three.js's auto-batching.
- **Dispose everything.** Every `geometry.dispose()`, `material.dispose()`,
  `texture.dispose()`, `renderTarget.dispose()` must be paired with allocation in
  a cleanup function.

## Input

- **Pointer events only.** Every interaction handler uses `pointerdown` /
  `pointermove` / `pointerup` / `pointercancel` + `wheel` + multi-touch gesture
  detection. `mousedown` / `mousemove` / `mouseup` and `touchstart` / `touchmove` /
  `touchend` are forbidden in new code — pointer events unify them and respect
  pen, stylus, and accessibility hardware.
- **`touch-action: none`** CSS rule on every canvas to suppress native gesture
  handling.
- **Pointer capture** via `target.setPointerCapture(e.pointerId)` so drags don't
  break when the pointer leaves the canvas.

## Render Loop

A single `frameLoopManager` from `@tuomashatakka/canvas-loop-framecapper` drives
every subsystem. FPS caps, pausing, and time accumulation are centralized. See
`scripts/frame-loop.js` for the wrapper that adapts it to three.js scenes.

## Async Asset Loading

- **`KTX2Loader`** for compressed textures (Basis Universal). 4–8× smaller than
  PNG, transcoded directly to GPU-native formats.
- **`DRACOLoader` + `MeshoptDecoder`** for compressed meshes via glTF.
- **`ImageBitmapLoader`** for plain image textures — non-blocking decode.
- Always `await` loading before first render. Don't push half-loaded assets into
  the scene.

## Style Guarantees

Every output produced under this skill must:

- Follow `@tuomashatakka/eslint-config` (no semicolons, single quotes, two-space
  indent, no `any`).
- Apply Semantic Nodes style to all non-3D UI (HTML5 landmarks, design-token CSS,
  tag selectors over class selectors).
- No Tailwind, Shadcn, Radix, CSS Modules, styled-components, or `className`-as-
  styling-prop anywhere.
- Use `pointer*` events exclusively.
- Cap `setPixelRatio` at 2.

## The Five Questions Before Writing Code

Before drafting any new module, answer these:

1. **Is there an existing primitive in the codebase that already solves part of
   this?** Reuse + extend before duplicating.
2. **What's the perf class — cheap / medium / expensive?** Annotate this in a
   `// perf:` comment at the bottom of the module.
3. **Is the data shape closed (config) or open (procedural)?** Closed → static
   config object. Open → seeded factory.
4. **Does this need to work on touch?** Default answer: yes.
5. **What's the dispose path?** Every allocation has a paired teardown.
