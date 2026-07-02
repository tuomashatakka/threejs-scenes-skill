# Cinematic lighting & streaming worlds

Patterns abstracted from three shipping projects — anime-anima (cinematic VRM
viewer), shaders-fr (AI-generated infinite liminal walker) and
webgl-journey-hell (raymarched shader journeys) — now first-class library
factories. Load this doc when a request mentions: mood/stage lighting, light
beams, colour grading / LUT / teal-and-orange, endless corridors / on-rails
camera / streaming rooms, tunnels or tube geometry along a path, triplanar
materials, or full-screen shader (shadertoy-style) scenes.

## Named lighting presets — `createLightingRig` (lighting)

Five hand-tuned cinematic rigs: `dramatic`, `studio`, `soft`, `neon`, `sunset`.
One call builds hemi + key + rim + accent + spot lights and two volumetric
beam cones; `setPreset()` retunes everything (background, fog, exposure
included) with zero allocation.

```js
import { createLightingRig } from '@scenes'

const rig = createLightingRig(scene, renderer, { preset: 'neon' })
ui.onChange(name => rig.setPreset(name))   // 'dramatic' shows the beam cones
```

Extend with your own configs via `presets: { myLook: {...} }` (see
`LightingConfig`). Beams only show on presets with a `beams` entry.

## Volumetric beams — `createLightCone` (lighting)

Additive open cone with rim fresnel + length falloff. Reads as a theatrical
shaft with no raymarching. `createLightCone(from, to, { color, spread })`
returns a mesh — add to the scene, dispose geometry+material when done.

## Cinematic colour grade — `createCinematicLUT` (post)

Procedural teal-and-orange `Data3DTexture` (S-curve contrast, split toning,
saturation lift) for three's `LUTPass` — no `.cube` asset to ship.

```js
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js'
composer.addPass(new LUTPass({ lut: createCinematicLUT(), intensity: 0.6 }))
```

## Endless streaming worlds — `createSegmentStream` (procedural) + `createPathCamera` (camera)

The infinite-corridor engine: author segments in local space (entrance at
origin facing +z, an exit position + tangent, and path control points), then
`append()` — the stream world-aligns each segment to continue the previous
exit, rebuilds one shared CatmullRom curve, and evicts + disposes segments
beyond `maxActive`. Constant memory, endless path.

```js
const stream = createSegmentStream(scene, { maxActive: 4 })
const rails  = createPathCamera(camera, stream, canvas, { speed: 2.4 })

function addSegment () {
  const room = buildRoom()   // any Object3D + dispose()
  stream.append({
    object:     room.group,
    dispose:    room.dispose,
    pathPoints: [[ 0, 0, 0 ], [ 0, 0, 6 ], [ 1, 0, 11 ]],
    exit:       { position: [ 1, 0, 12 ], tangent: [ 0.2, 0, 1 ]},
  })
}

addSegment(); addSegment()
loop.onFrame(ctx => {
  rails.update(ctx)
  // prefetch: keep 2 segments ahead of the camera
  if (stream.indexAt(rails.distance) >= stream.segments.length - 2)
    addSegment()
})
```

`createPathCamera` looks down the curve tangent and layers exp-smoothed
pointer look-around (recenters on release). It deliberately samples with
`getPoint`, not `getPointAt` — the arc-length cache can NaN on freshly
rebuilt curves.

## Path tubes — `parallelTransportFrames` / `createPathTube` (geometry)

Twist-free frames along a polyline and a swept-circle tube with a per-point
radius function. Tunnels (`inward: true`), conduits, tentacles.

```js
const points = curve.getPoints(120)
const tube   = createPathTube(points, {
  radius: (t, i) => 2 + Math.sin(t * 14) * 0.3,   // bulges are free
  radialSegments: 24,
  inward: true,                                    // fly through it
})
scene.add(new THREE.Mesh(tube, createTriplanarMaterial()))
```

## Triplanar grid material — `createTriplanarMaterial` (materials)

World-space UVs picked by dominant normal axis — no unwrap, no seams on
procedural geometry. Palette-driven ([baseA, baseB, grid]) with analytic grid
lines, cheap directional shading and a distance fog tint. Perfect partner for
`createPathTube` and `createSegmentStream` rooms.

## Full-screen shader scenes — `createShaderQuad` (materials)

Shadertoy-style fragment shader over one fullscreen triangle with the standard
uniform contract `iResolution` (device px), `iTime` (s), `uPointer` (-1..1).

```js
const quad = createShaderQuad({ fragmentShader: RAYMARCH_GLSL, pointerElement: canvas })
loop.onFrame(ctx => quad.render(ctx, renderer))       // shader-only scene
// or quad.update(ctx, renderer) + your own composition
```

## Provenance & guarantees

- All factories follow the library contract: explicit `dispose()`, zero
  per-frame allocation, seeded determinism where randomness exists.
- `createSegmentStream` + `createPathCamera` + `createTriplanarMaterial`
  mirror shaders-fr's LLM-driven room pipeline — pair them with the ai-sdk
  tool schemas in `references/llm-driven-content.md` to regenerate that flow.
