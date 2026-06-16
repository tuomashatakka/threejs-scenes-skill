# Post-Processing

Effect composer setup and pass library.

## Pipeline

Use `EffectComposer` from `three/addons/postprocessing/EffectComposer.js`.
Canonical chain order:

```
RenderPass → GodRays → UnrealBloom → DOF+CA → Glitch (optional) → FilmGrain → HudBeam → OutputPass
```

Order matters: DOF before grain (grain shouldn't blur), bloom after god rays
(you want the rays to bloom), glitch before grain (grain sits on top of
glitch), OutputPass last (handles tonemapping + color space).

See `scripts/composer-setup.js` for the factory.

## Composer Setup

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js'

const composer = new EffectComposer(renderer)
composer.setSize(width, height)
composer.addPass(new RenderPass(scene, camera))
// ... add effect passes
composer.addPass(new OutputPass())

// each frame
composer.render()   // instead of renderer.render(scene, camera)
```

To enable depth-based effects (DOF, soft particles, god rays from light
position): supply a `DepthTexture` on the composer's first render target:

```js
const depthTexture = new THREE.DepthTexture(width, height)
composer.renderTarget1.depthTexture = depthTexture
composer.renderTarget2.depthTexture = depthTexture
// access from passes via composer.renderTarget1.depthTexture
```

## Bloom

`UnrealBloomPass` is the default. For selective bloom (only specific objects
glow), render the scene twice into separate render targets with a masking
layer, bloom the emissive target, additively combine. Cheaper alternative:
drive bloom threshold from material emissive only and ensure non-glowing
materials stay below the threshold.

```js
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.7, 0.4, 0.85)
//                                                              strength radius threshold
composer.addPass(bloom)
```

## Glitch Effects

Glitch is a family. Ship them as discrete `ShaderPass` factories with a
uniform-driven `intensity` so they can be ramped and mixed. See
`scripts/glitch-passes.js` for full implementations of:

- **RGB shift** — chromatic channel separation along an angle.
- **Block displacement** — randomly shifts blocky regions of the screen,
  occasional channel swaps at extreme intensity.
- **Scan corruption** — VHS-style horizontal scan bands with brightness
  spikes and jitter.

Stack them with separate intensity uniforms to dial in datamosh feels.

## Lens Flares

Use `Lensflare` from `three/addons/objects/Lensflare.js`. Attach to lights —
they self-occlude against scene depth via an internal occlusion test.

```js
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'

const textureFlare0 = await loader.loadAsync('/flares/lensflare0.png')
const textureFlare3 = await loader.loadAsync('/flares/lensflare3.png')

const flare = new Lensflare()
flare.addElement(new LensflareElement(textureFlare0, 700, 0))
flare.addElement(new LensflareElement(textureFlare3, 60,  0.6))
flare.addElement(new LensflareElement(textureFlare3, 70,  0.7))
flare.addElement(new LensflareElement(textureFlare3, 120, 0.9))
sunLight.add(flare)
```

## God Rays (Volumetric Light Shafts)

Screen-space radial blur sampled toward the light's screen-space position,
additively composited. Cheaper than true volumetrics. The light source needs
to be in front of the camera for the effect to register. See
`scripts/god-rays-pass.js`.

```js
import { createGodRaysPass } from './god-rays-pass.js'

const godRays = createGodRaysPass()
composer.addPass(godRays)

// each frame, project the sun position to screen space
godRays.updateFromLight(sunLight.position, camera)
```

## Depth of Field with Chromatic Aberration

`BokehPass` is expensive. The cheaper approach: blur radius driven by absolute
distance between fragment's linear depth and a `uFocalDistance`, with chromatic
separation modulated by the same `coc` (circle of confusion) value. Focal
point is configurable as either a world-space `Vector3` (auto-projected each
frame) or a screen-space uv.

See `scripts/dof-chromatic-pass.js`. Wire-up requires the composer to have a
`DepthTexture` (see "Composer Setup" above).

```js
import { createDofPass } from './dof-chromatic-pass.js'

const dof = createDofPass({
  focalDistance: 10,
  focalRange: 4,
  maxBlur: 0.015,
  caStrength: 0.5,
})
dof.uniforms.tDepth.value = composer.renderTarget1.depthTexture
composer.addPass(dof)

// dynamic focal point — track a world-space target each frame
const focalProjected = new THREE.Vector3()
focalProjected.copy(targetObject.position).project(camera)
dof.uniforms.uFocalDistance.value = focalProjected.distanceTo(camera.position)
```

## Stereoscopy

three.js ships three stereo modes in `three/addons/effects/`:

- **`AnaglyphEffect`** — red/cyan glasses. Cheap.
- **`StereoEffect`** — split-screen side-by-side for cardboard/VR viewers.
- **`ParallaxBarrierEffect`** — for parallax-barrier 3D screens (rare).

They wrap the renderer and replace `render(scene, camera)` with their own
dual-eye pass. Swap dynamically based on user preference. They bypass
`EffectComposer` — so for stereo + post-fx you must render each eye into a
render target, run the post chain per eye, and composite. Expensive; offer
it as a quality tier.

See `scripts/stereoscopy.js`.

```js
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js'

const fx = new AnaglyphEffect(renderer)
fx.setSize(width, height)

// instead of composer.render() / renderer.render():
fx.render(scene, camera)
```

## Film Grain

Procedural per-fragment noise added to the color, optionally desaturated, with
luminance-only toggle. See `scripts/film-grain-pass.js`.

```js
import { createFilmGrainPass } from './film-grain-pass.js'

const grain = createFilmGrainPass()
grain.uniforms.uIntensity.value = 0.08
grain.uniforms.uLuma.value = 0.5     // 0 = color grain, 1 = luma grain
composer.addPass(grain)
```

## HUD Beam Transition

Horizontal phase-in: a luminous beam sweeps left → right, revealing content
behind it with RGB-split fringes, leaving a settling glow. Drive it from a
single `uProgress` uniform (0..1). Swap content visibility at progress > 0.5
so the beam masks the cut.

See `scripts/hud-beam-transition.js`. The factory returns a `play(onMidpoint)`
method that takes a callback fired the exact frame the beam crosses 0.5 — that's
where you swap the underlying content.

```js
import { createHudBeamTransition } from './hud-beam-transition.js'

const hudBeam = createHudBeamTransition({
  duration: 0.9,
  onComplete: () => console.log('transitioned'),
})
composer.addPass(hudBeam.pass)

// trigger
hudBeam.play(() => {
  // swap scene content here — beam is at peak coverage
  swapHudContent()
})

// in the frame loop
hudBeam.tick(delta, elapsed)
```

## Per-Quality-Tier Gating

Keep post-fx mostly off on mobile. Expose a quality tier flag:

```js
const PASSES = {
  mobile:  ['render', 'bloom', 'output'],
  desktop: ['render', 'godRays', 'bloom', 'dof', 'filmGrain', 'output'],
  highEnd: ['render', 'godRays', 'bloom', 'dof', 'glitch', 'filmGrain', 'output'],
}
```

## Common Pitfalls

- Forgetting to attach a `DepthTexture` to the composer when DOF/godrays need it.
- Stacking 5+ passes on mobile — each pass is a fullscreen fragment shader.
- Order matters: putting `OutputPass` before effect passes corrupts color
  space; putting bloom before god rays makes rays not bloom.
- `composer.setSize()` not called on resize → blurry/stretched output.
- Mixing `composer.render()` and `renderer.render()` — pick one per frame.
- Bloom radius scaled with viewport — looks dramatic on small screens, weak
  on big ones. Use a fixed pixel-equivalent radius.
