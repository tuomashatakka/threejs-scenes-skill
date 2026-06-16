---
name: threejs-scenes
description: >
  Build production-quality three.js WebGL scenes with vanilla three.js (no R3F).
  Use this skill whenever the user mentions three.js, WebGL, 3D scenes in the browser,
  isometric games, voxel worlds, infinite/endless scrollable 3D, procedural geometry,
  instancing/BatchedMesh, billboards, particle systems, shader effects, glitch effects,
  bloom, lens flares, god rays, depth of field, chromatic aberration, stereoscopy,
  anaglyph, film grain, HUD transitions, camera controls (orbit/follow/pan-zoom),
  touch-friendly 3D controls, three.js performance optimization, draw-call reduction,
  LOD, post-processing chains, EffectComposer, GLSL ShaderMaterial, or LLM-driven
  programmatic generation of three.js content. Also trigger when the user wants to
  build a 3D web experience, mounts a `canvas` for three.js, asks "how do I make
  this run smooth", needs frame-rate capping, or wants to generate 3D assets from
  text prompts via Gemini / ai-sdk function tools.

---

# three.js Scenes ⚘ Production Skill

Vanilla three.js (WebGL2) skill covering scene composition, programmatic generation,
camera handling, post-processing, voxel worlds, infinite scenes, and LLM-driven
codegen. No WebGPU, no R3F, no Drei — just `three` from the main entry point.

## Reference Index

Load only what the current task needs. Don't read every file by default.

| File | Load when… |
|------|-----------|
| `references/core-principles.md` | starting any new three.js work — read first |
| `references/project-architecture.md` | scaffolding a project, organizing folders, wiring the frame loop |
| `references/instancing.md` | rendering many copies of geometry; choosing `InstancedMesh` vs `BatchedMesh` |
| `references/textures-and-maps.md` | working with diffuse/normal/ORM maps, UV offsets, procedural textures |
| `references/shaders.md` | writing custom `ShaderMaterial` / `RawShaderMaterial`; GLSL composition |
| `references/lighting.md` | scene lighting — IBL, sun, shadow tuning, hemisphere fill |
| `references/particles.md` | particle systems — CPU instanced or GPGPU via `GPUComputationRenderer` |
| `references/performance.md` | optimization, profiling, draw-call reduction, memory/GC discipline |
| `references/programmatic-generation.md` | runtime geometry/texture/instance generation; seeded factories |
| `references/isometric-and-infinite-scenes.md` | iso cameras, chunk managers, infinite worlds, origin rebasing |
| `references/voxel-geometry.md` | voxel chunks, greedy meshing, smooth voxels |
| `references/billboards.md` | sprites, GLSL-billboarded `InstancedMesh`, cylindrical vs spherical |
| `references/camera-handling.md` | camera setup, touch-first controls, pointer gestures, resize |
| `references/post-processing.md` | EffectComposer chains — bloom, god rays, DOF+CA, glitch, grain, HUD beam, stereoscopy |
| `references/prompt-handling-flow.md` | how to classify and respond to user prompts; codegen flow |
| `references/llm-function-definitions.md` | Gemini / ai-sdk tool schemas for procedural scene generation |
| `references/code-style.md` | `@tuomashatakka/eslint-config` + Semantic Nodes style guide rules |
| `references/anti-patterns.md` | quick scan before committing — avoid these |

**Minimal scene:** `core-principles.md` + `project-architecture.md` + `camera-handling.md`.
**Isometric game:** add `isometric-and-infinite-scenes.md` + `instancing.md` + `billboards.md`.
**Voxel world:** add `voxel-geometry.md` + `performance.md`.
**Stylized post-fx:** add `post-processing.md` + `shaders.md`.
**LLM-driven content:** add `prompt-handling-flow.md` + `llm-function-definitions.md`.

## Scripts Index

The `scripts/` directory contains production-ready ES-module JavaScript implementations
of every reference example. See `scripts/INDEX.md` for the full table mapping each
script to its reference section and a one-line summary.

When asked to build something covered by a script, read the script directly rather
than re-deriving the code. Adapt the function signatures and options to the user's
specific request — the scripts are templates, not black boxes.

## Embedding Scripts in Live Artifacts

Three.js scenes ship to the user as Claude **artifacts** of type `text/html`. The
artifact runs in a sandboxed iframe with no access to a build tool, so every script
in `scripts/` is authored as a self-contained ES module that can be:

1. **Pasted as a function body** into a `<script type="module">` block — simplest
   for one-off demos.
2. **Imported via `esm.sh`** with importmaps — clean for multi-module artifacts.

### Pattern 1 — Inline (smallest artifacts, single-file demos)

Read the relevant script file with `view`, then copy the exported functions into the
`<script type="module">` block of the artifact. Replace the `import * as THREE from
'three'` line with a CDN import from `esm.sh`. Inline `frame-loop.js` first (it's the
backbone), then add the modules the scene needs.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>three.js scene</title>
  <link rel="stylesheet" href="tokens.css" />
  <style>
    html, body { margin: 0; height: 100%; background: var(--color-neutral-950); overflow: hidden }
    canvas { display: block; width: 100%; height: 100%; touch-action: none }
  </style>
</head>
<body>
  <main>
    <canvas id="scene"></canvas>
  </main>

  <script type="module">
    import * as THREE from 'https://esm.sh/three@0.184.0'
    import { EffectComposer } from 'https://esm.sh/three@0.184.0/addons/postprocessing/EffectComposer.js'
    import { RenderPass }     from 'https://esm.sh/three@0.184.0/addons/postprocessing/RenderPass.js'
    import { OutputPass }     from 'https://esm.sh/three@0.184.0/addons/postprocessing/OutputPass.js'

    // ----- PASTED FROM scripts/frame-loop.js -----
    // (copy the full module contents here, omitting the import line)

    // ----- PASTED FROM scripts/renderer-setup.js -----

    // ----- PASTED FROM scripts/pointer-gesture.js -----

    // ----- scene wiring -----
    const canvas = document.querySelector('#scene')
    const renderer = createRenderer({ canvas })
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 200)
    camera.position.set(4, 3, 6)
    camera.lookAt(0, 0, 0)

    startRenderLoop({ renderer, scene, camera })
  </script>
</body>
</html>
```

### Pattern 2 — Importmap (multi-module artifacts, cleaner separation)

For larger scenes, use an importmap so the `import` paths inside each pasted script
need no rewriting. Three.js addons resolve through the same map.

```html
<script type="importmap">
{
  "imports": {
    "three":               "https://esm.sh/three@0.184.0",
    "three/addons/":       "https://esm.sh/three@0.184.0/addons/"
  }
}
</script>
<script type="module">
  import * as THREE from 'three'
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
  // … scripts paste in unchanged
</script>
```

### Pattern 3 — `<script type="module">` from `data:` URLs (rare, only when isolation matters)

Only use when an artifact mixes multiple isolated demos in one HTML page. Convert
each script to a `data:text/javascript;base64,` URL and import it. Most artifacts
should NOT need this.

### Embedding Checklist

Before shipping any artifact:

- [ ] Canvas element exists and has `touch-action: none` in CSS.
- [ ] Renderer uses `setPixelRatio(Math.min(window.devicePixelRatio, 2))`.
- [ ] A `ResizeObserver` is attached to the canvas's parent (NOT `window.resize`).
- [ ] Every pointer interaction uses `pointerdown`/`pointermove`/`pointerup`/`pointercancel` — never `mouse*` or `touch*`.
- [ ] The frame loop is the singleton `frameLoopManager` from `scripts/frame-loop.js`.
- [ ] Cleanup function disposes geometries, materials, textures, render targets.
- [ ] No `new Vector3()` / `new Matrix4()` / `new Color()` inside the render loop.
- [ ] Materials are shared across meshes wherever possible.
- [ ] Programmatic data (instance transforms, geometry vertices, particle attributes) is generated from a seeded factory, not hand-typed past ~20 entries.
- [ ] On mobile (`navigator.maxTouchPoints > 0`), expensive post-fx (god rays, DOF) are disabled by default.

## Prompt Handling Flow

Every user request goes through classification + scoped action. See
`references/prompt-handling-flow.md` for the full taxonomy.

Quick decision tree:

1. **Is this a one-off question or a scene to build?** Question → answer inline.
   Scene → continue.
2. **Read `core-principles.md`** if not already loaded this session.
3. **Classify the request** (geometry / shader / camera / effect-pass / instancing /
   particle / lighting / scene-composition / optimization / debug).
4. **Load the matching reference file(s)** from the table above.
5. **Reuse scripts** — check `scripts/INDEX.md` before writing anything from scratch.
6. **Generate via LLM tools** if the task is procedural and config-driven (palette,
   placement, voxel level layout, shader recipe). See
   `references/llm-function-definitions.md`.
7. **Emit code** as a complete, working module with a `// perf:` annotation.
8. **Wire into artifact** following the embedding patterns above.

## Style Guarantees

Every artifact and code module produced under this skill must:

- Follow `@tuomashatakka/eslint-config` (no semis, single quotes, two-space indent, no `any`).
- Apply Semantic Nodes style to all non-3D UI (HTML5 landmarks, design-token CSS,
  tag selectors over class selectors, no Tailwind / Shadcn / Radix / CSS Modules).
- Use `pointer*` events exclusively — never `mouse*` or `touch*`.
- Disable native gestures over the canvas with `touch-action: none`.
- Cap pixel ratio at 2.
- Annotate non-trivial outputs with expected draw-call class and memory footprint.

## When Things Go Wrong

- **Black canvas** → camera position likely inside geometry, or scene has no lights AND material isn't `MeshBasicMaterial`. Add a `HemisphereLight` for fast diagnosis.
- **Shader compile error** → wrap GLSL in `/* glsl */` template literals; check uniform names match exactly between JS and shader.
- **Frame stalls on first render** → call `renderer.compile(scene, camera)` before first `render()`.
- **GC spikes mid-scene** → audit the render loop for `new Vector3()`, closures capturing fresh objects, or `Array.from()` calls.
- **Touch drag breaks when finger leaves canvas** → missing `el.setPointerCapture(e.pointerId)` in `pointerdown`.
- **Sharp aliasing on mobile** → `antialias: true` is often ignored on iOS; use FXAA pass instead.
- **Z-fighting on co-planar surfaces** → tighten the camera frustum (`near` / `far`) or use logarithmic depth buffer.
