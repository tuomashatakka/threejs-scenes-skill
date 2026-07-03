# Lighting

Scene lighting hierarchy and shadow tuning.

## Hierarchy

1. **Environment / IBL first.** PMREM-prefiltered env map is the cheapest,
   best-looking diffuse + specular baseline. Use `RoomEnvironment` for free
   indoor lighting during dev; ship HDR equirectangular maps via `RGBELoader`.
2. **One `DirectionalLight`** for the sun. Tune `shadow.camera` aggressively —
   oversized frustums waste depth precision and tank performance.
3. **`HemisphereLight`** for cheap sky/ground ambient — preferable to
   `AmbientLight` because it adds directional cues from sky vs ground colors.
4. **`PointLight` / `SpotLight`** sparingly. Each with shadows costs a full
   shadow render pass per frame.
5. **`LightProbe`** for SH-baked lighting where applicable.
6. **`RectAreaLight`** for soft realistic accents (no shadow support).

See `scripts/lighting-setup.js` for the standard setup.

## IBL Setup

```js
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

function applyEnvironment (scene, renderer, intensity = 1) {
  const pmrem = new THREE.PMREMGenerator(renderer)
  const envScene = new RoomEnvironment()
  const envTexture = pmrem.fromScene(envScene, 0.04).texture
  scene.environment = envTexture
  scene.environmentIntensity = intensity
  pmrem.dispose()
  envScene.traverse(o => o.geometry?.dispose())
  return envTexture
}
```

For real outdoor scenes, load an HDR equirectangular:

```js
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'

const hdr = await new RGBELoader().loadAsync('/env/sunset.hdr')
hdr.mapping = THREE.EquirectangularReflectionMapping
const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromEquirectangular(hdr).texture
hdr.dispose()
pmrem.dispose()
```

## Shadow Tuning

The single biggest lighting performance lever. Tight shadow frustum + smallest
acceptable map size + `PCFSoftShadowMap` (or `VSMShadowMap`) wins.

```js
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const sun = new THREE.DirectionalLight('#fff5e0', 3)
sun.position.set(8, 12, 6)
sun.castShadow = true
sun.shadow.mapSize.set(2048, 2048)
sun.shadow.camera.near = 1
sun.shadow.camera.far = 30
sun.shadow.camera.top = sun.shadow.camera.right = 15
sun.shadow.camera.bottom = sun.shadow.camera.left = -15
sun.shadow.bias = -0.0001
sun.shadow.normalBias = 0.02
scene.add(sun, sun.target)
```

Visualize the shadow frustum during development:

```js
import { CameraHelper } from 'three'
scene.add(new CameraHelper(sun.shadow.camera))
```

## Cascaded Shadow Maps

For large outdoor scenes (open world, infinite terrain), a single shadow camera
can't cover both near detail and far distance. Use cascaded shadow maps via
`CSM` from `three/addons/csm/CSM.js`:

```js
import { CSM } from 'three/addons/csm/CSM.js'

const csm = new CSM({
  maxFar: 200,
  cascades: 4,
  mode: 'practical',
  parent: scene,
  shadowMapSize: 2048,
  lightDirection: new THREE.Vector3(1, -1, 1).normalize(),
  camera,
})

// every frame
csm.update()

// every material that should receive cascaded shadows
csm.setupMaterial(material)
```

## Hemisphere Fill

Cheap ambient with directional bias:

```js
const sky = new THREE.HemisphereLight('#a0c0ff', '#3a2a1a', 0.4)
scene.add(sky)
```

`AmbientLight` is functionally equivalent to `HemisphereLight` with both colors
the same — prefer hemisphere for the free vertical gradient.

## Light Counts and Recompilation

Adding a light past the scene's current light count triggers a full shader
recompile for every material in the scene. To avoid recompile stalls:

- Add all lights at scene init, even if some start with `intensity = 0`.
- Toggle visibility / intensity instead of `add()` / `remove()` mid-game.

## Per-Quality-Tier Lighting

```js
const QUALITY = {
  mobile:   { shadowSize: 1024, shadows: 'PCF',     csm: false },
  desktop:  { shadowSize: 2048, shadows: 'PCFSoft', csm: false },
  highEnd:  { shadowSize: 4096, shadows: 'VSM',     csm: true  },
}
```

Detect tier at boot from `navigator.hardwareConcurrency`, GPU info via
`debug_renderer_info`, and `navigator.maxTouchPoints > 0`.

## Common Pitfalls

- Using `AmbientLight` as a sole light — flattens everything, looks dead.
- 4096² shadow maps "just to be safe" — usually overkill and tanks mobile FPS.
- Shadow camera frustum sized to the whole world — depth precision collapses,
  shadows look chunky everywhere.
- Forgetting `castShadow` on the mesh OR `receiveShadow` on the floor — one
  side missing breaks the whole effect.
- Adding/removing lights at runtime — triggers shader recompile every time.
- Using `RectAreaLight` and expecting shadows — they don't support shadows.

## Live three.js docs

- API pages: [DirectionalLight](https://threejs.org/docs/pages/DirectionalLight.html.md), [HemisphereLight](https://threejs.org/docs/pages/HemisphereLight.html.md), [SpotLight](https://threejs.org/docs/pages/SpotLight.html.md), [RectAreaLight](https://threejs.org/docs/pages/RectAreaLight.html.md), [PMREMGenerator](https://threejs.org/docs/pages/PMREMGenerator.html.md).
- Manual: `node scripts/query-threejs-docs.js manual en/lights` (also `en/shadows`). Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
