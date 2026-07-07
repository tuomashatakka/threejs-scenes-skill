# Using the local library

The skill ships a **local, version-pinned copy** of the compiled library at
`skill/lib/dist/`. Templates and artifacts import it directly — no `npm install`, no
CDN fetch of the package. `bun run build` compiles `lib/` to `dist/` and the
`copy:lib` step mirrors it into `skill/lib/dist/` and `public/lib/dist/`.

## Importmap pattern

For any standalone HTML artifact, map the library to the local copy and three.js to
the esm.sh CDN:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://esm.sh/three@0.184.0",
    "three/addons/": "https://esm.sh/three@0.184.0/examples/jsm/",
    "@scenes": "../lib/dist/index.js",
    "@scenes/jsx": "../lib/dist/jsx/index.js"
  }
}
</script>
<script type="module">
  import { bootstrapScene, createStandardMaterial } from '@scenes'
  import { render, h, signal } from '@scenes/jsx'
  // …
</script>
```

The library's internals import the bare specifier `three` (and `three/addons/`),
which the importmap resolves to esm.sh — so there is exactly one three.js instance.
Adjust the `../lib/dist/` prefix to your file's depth (templates and demos both sit one
directory above `lib/`, so `../lib/dist/` is correct in both).

## Why local, not the npm package

The package publishes to the **GitHub Packages registry** (`@tuomashatakka/threejs-scenes`),
which is auth-gated — esm.sh and unpkg can't fetch it, so artifacts can't `import`
it from a public CDN. A bundled local copy keeps every generated scene:

- **self-contained** — the `.skill` bundle and the Pages showcase run with no install;
- **version-pinned** — the skill's behavior can't drift when the package updates;
- **debuggable** — the emitted source ships with source maps.

Working references: every file in `skill/templates/*.html` imports the local lib this
way. The public showcase (`public/`) uses the same pattern against `public/lib/dist/`.

## Consolidated Public Entry Points

Instead of exposing dozens of subpaths, the library simplifies integration into three clean, tree-shakeable public entry points:

- `@tuomashatakka/threejs-scenes`: Unified core containing WebGL scaffolding, cameras, animations, lighting, materials, geometry, instancing, loaders, and state management.
- `@tuomashatakka/threejs-scenes/webgpu`: WebGPU post-processing and node-based effects (isolated to prevent standard WebGL scenes from needing to resolve `three/webgpu` + `three/tsl`).
- `@tuomashatakka/threejs-scenes/jsx`: Declarative, reactive JSX layer.

```js
import { createIsoScaffold, tweened, EASINGS } from '@tuomashatakka/threejs-scenes'
import { render, h } from '@tuomashatakka/threejs-scenes/jsx'
```

Every scaffold accepts `state` as a plain object, a store, or any
`{ get, subscribe }` controller; external controllers stay bound so data flows
controller → app → modules → scene, one direction, with `tweened` easing the
numeric transitions.
