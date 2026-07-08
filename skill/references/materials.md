# Materials — common starting points

Tuned starting materials so you don't hand-set `metalness`/`roughness` every time.
From the core package (`@tuomashatakka/threejs-scenes`, or `@scenes`).
See [library.md](./library.md) for the importmap.

## PBR presets

```js
import { createStandardMaterial, MATERIAL_PRESETS } from '@scenes'

createStandardMaterial('gold')                       // a tuned MeshStandardMaterial
createStandardMaterial('plastic', { color: '#5fb0ff' })  // preset + overrides
createStandardMaterial({ metalness: 0.5, roughness: 0.2 })  // raw params, no preset
```

`MATERIAL_PRESETS` keys: `metal`, `chrome`, `gold`, `plastic`, `rubber`, `glass`,
`matte`, `emissive`. Overrides always win over the preset.

**`glass` is special** — it returns a `MeshPhysicalMaterial` with `transmission: 1`,
`thickness`, and `ior` so it actually refracts. The others are `MeshStandardMaterial`.
Glass/transmission needs an environment map to look like anything — set one up with
`setupStandardLighting` (see [lighting.md](./lighting.md)).

## Toon (cel) shading

```js
import { createToonMaterial, createGradientToonMap } from '@scenes'

createToonMaterial({ color: '#ff7ad9', steps: 4 })
const ramp = createGradientToonMap(3)   // a NearestFilter DataTexture → hard bands
```

`createGradientToonMap(steps)` builds the quantized ramp; `NearestFilter` keeps the
bands crisp (linear filtering would smear them back into a gradient).

## Matcap

```js
import { createMatcapMaterial } from '@scenes'

createMatcapMaterial(loadedTexture)
createMatcapMaterial('https://…/matcap.png')  // browser only; headless leaves matcap unset (DOM-guarded)
```

Matcaps bake lighting into a sphere texture — zero scene lights needed, very cheap,
great for stylized props and editors.

## Tone mapping

The renderer applies ACES tone mapping by default. **If you add post-processing,
tone-map exactly once at the `OutputPass`** and turn the renderer's tone mapping off —
double tone-mapping washes everything out. See [post-processing.md](./post-processing.md).
For `emissive` materials to bloom, drive `emissiveIntensity` above 1 and add bloom.

## Reuse & dispose

Materials compile a shader on first use. **Share one material instance across meshes**
rather than building one per mesh — fewer compiles, fewer state changes. For pooled
sharing across modules use `MaterialPool` (see [project-architecture.md](./project-architecture.md)).
Dispose materials (and their textures) on teardown via `disposeScene(root)`; never
dispose a pooled/shared material a module didn't create.

## Live three.js docs

- API pages: [MeshStandardMaterial](https://threejs.org/docs/pages/MeshStandardMaterial.html.md), [MeshPhysicalMaterial](https://threejs.org/docs/pages/MeshPhysicalMaterial.html.md), [MeshToonMaterial](https://threejs.org/docs/pages/MeshToonMaterial.html.md), [MeshMatcapMaterial](https://threejs.org/docs/pages/MeshMatcapMaterial.html.md).
- Node materials (WebGPU/TSL): [llms-full.txt](https://threejs.org/docs/llms-full.txt) sections *NodeMaterial* → *SpriteNodeMaterial* (`node scripts/query-threejs-docs.js section nodematerial`).
- Manual: `node scripts/query-threejs-docs.js manual en/materials` (also `en/material-table`). Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
