# Textures and Maps

Surface texturing with diffuse, normal, ORM-packed maps, UV manipulation, and
runtime-generated textures.

## Diffuse / Base Color

The base color channel. Author or generate in sRGB color space; three.js
converts to linear for lighting math automatically.

```js
const loader = new THREE.TextureLoader()
const albedo = await loader.loadAsync('/textures/brick-albedo.jpg')
albedo.colorSpace = THREE.SRGBColorSpace
albedo.wrapS = albedo.wrapT = THREE.RepeatWrapping
albedo.anisotropy = renderer.capabilities.getMaxAnisotropy()

const material = new THREE.MeshStandardMaterial({ map: albedo })
```

## Normal Map

Surface micro-detail without extra geometry. Always tangent-space (blue/purple).
Color space MUST stay `NoColorSpace` / linear — sRGB conversion destroys normals.

```js
const normalTex = await loader.loadAsync('/textures/brick-normal.jpg')
normalTex.colorSpace = THREE.NoColorSpace

material.normalMap = normalTex
material.normalScale.set(1, 1)
```

## ORM-Packed (Occlusion / Roughness / Metallic)

Pack Occlusion (R), Roughness (G), Metallic (B) into a single texture to halve
sampler count. Standard glTF convention.

```js
const orm = await loader.loadAsync('/textures/brick-orm.jpg')
orm.colorSpace = THREE.NoColorSpace

material.aoMap = orm
material.roughnessMap = orm
material.metalnessMap = orm
```

three.js samples the correct channel from `aoMap.r`, `roughnessMap.g`, and
`metalnessMap.b` automatically when you supply the same texture to all three.

## UV Offset and Tiling

`.offset` and `.repeat` on a Texture are baked into the UV transform matrix.

```js
// static tiling
texture.repeat.set(4, 4)
texture.offset.set(0.25, 0)
```

For animated scroll or per-instance UV offsets, write a custom shader. See
`references/shaders.md` for the pattern.

## Procedural Texture Generation

For procedural patterns, gradients, noise fields, sprite atlases, or data lookup
tables, generate textures at runtime. Three options ranked by use case:

1. **`DataTexture`** — direct typed-array upload. Best for noise fields, palettes,
   instance lookup tables. See `scripts/noise-texture.js`.
2. **`OffscreenCanvas` + Canvas2D** — best for text labels, simple sprite glyphs,
   dynamic atlases. See `scripts/glyph-atlas.js`.
3. **Render to a `WebGLRenderTarget`** — best for animated procedural textures
   (curl noise advection, flow maps, reaction-diffusion). Render a fullscreen
   quad with a `ShaderMaterial` into the target, then sample the target as a
   regular texture.

## Render-Target Procedural Textures

```js
const target = new THREE.WebGLRenderTarget(512, 512, {
  format: THREE.RGBAFormat,
  type: THREE.FloatType,
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
})

const quadScene = new THREE.Scene()
const quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
const quad = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader })
)
quadScene.add(quad)

renderer.setRenderTarget(target)
renderer.render(quadScene, quadCamera)
renderer.setRenderTarget(null)

// now use target.texture anywhere
material.map = target.texture
```

## Compression Pipeline

For shipped assets: **KTX2 + Basis Universal** via `@gltf-transform/cli`.
4–8× smaller than PNG, transcoded directly to GPU-native formats. Load with
`KTX2Loader`. For meshes, **Draco + Meshopt** compression via glTF.

```js
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath('https://unpkg.com/three@0.184.0/examples/jsm/libs/basis/')
  .detectSupport(renderer)

const texture = await ktx2Loader.loadAsync('/textures/brick.ktx2')
```

## Filtering and Anisotropy

- `LinearFilter` / `LinearMipmapLinearFilter` (trilinear) — default, good for
  most surfaces.
- `NearestFilter` — pixelated look, voxel/retro aesthetics.
- `anisotropy = renderer.capabilities.getMaxAnisotropy()` — sharpens textures
  viewed at grazing angles. Free perf-wise on modern GPUs.

## Memory Footprint

Texture memory dominates GPU memory. A 4K RGBA mipmapped texture = ~85 MB.
Compressed KTX2: ~5–10 MB. Always prefer compressed formats for shipped assets;
use uncompressed only for procedural data textures.

## Common Pitfalls

- Wrong `colorSpace` on normal/ORM maps washes out lighting.
- Forgetting `texture.needsUpdate = true` after mutating a `DataTexture` array.
- Mipmaps on `DataTexture` with `NearestFilter` — disable with
  `texture.generateMipmaps = false`.
- Loading PNG in a hot loop — use `KTX2` or pre-decode via `ImageBitmapLoader`.
- Setting `anisotropy` to a value larger than `getMaxAnisotropy()` returns —
  silently capped, no error.

## Live three.js docs

- API pages: [Texture](https://threejs.org/docs/pages/Texture.html.md), [DataTexture](https://threejs.org/docs/pages/DataTexture.html.md), [TextureLoader](https://threejs.org/docs/pages/TextureLoader.html.md), [CanvasTexture](https://threejs.org/docs/pages/CanvasTexture.html.md).
- Manual: `node scripts/query-threejs-docs.js manual en/textures` (also `en/canvas-textures`, `en/indexed-textures`). Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
