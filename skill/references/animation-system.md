# Animation system

A convenience layer over three's `AnimationMixer` / `AnimationClip` / `AnimationAction`
(see the digested manual at `digests/threejs-manual/en/` → *animation-system*, and the
API pages `digests/threejs-docs/AnimationMixer.md`, `AnimationClip.md`,
`AnimationAction.md`). From the `animation` module
(`@tuomashatakka/threejs-scenes/animation`, or `@scenes`).

## Controller

```js
import { createAnimationController, spinClip, bobClip } from '@scenes'

const ctrl = createAnimationController(root, [ spinClip('y', 4), bobClip(0.3, 2) ], loop)
ctrl.play('spin', { loop: THREE.LoopRepeat })
ctrl.crossfade('spin', 'bob', 0.6)
// { mixer, actions, play, crossfade, stop, tick, dispose }
```

- `createAnimationController(root, clips?, loop?)` builds a mixer, caches one action
  per clip name, and — **if you pass a `FrameLoop`** — auto-registers `mixer.update(delta)`
  so playback follows the render loop. No loop? Call `ctrl.tick(ctx)` yourself.
- `play(name, opts)` — `opts: { loop, fadeIn, reset, clampWhenFinished, timeScale }`.
- `crossfade(from, to, dur)` — blends actions; resets + plays the target.
- `dispose()` — unregisters the tick, stops actions, `uncacheRoot`s the mixer. Always
  call it; mixers hold references.

## Programmatic clips

Author `AnimationClip`s in code — no imported model required:

```js
import { spinClip, bobClip, pulseScaleClip, combineClips } from '@scenes'

spinClip(axis = 'y', duration = 4)        // seamless 360° rotation
bobClip(amp = 0.3, duration = 2)          // vertical sine bob
pulseScaleClip(min = 0.9, max = 1.1, duration = 1.5)
combineClips('idle', [ bobClip(0.4, 2), pulseScaleClip(0.9, 1.1, 2) ])  // merge tracks
```

Lower-level track constructors for custom motion:

```js
import { numberTrack, vectorTrack, quaternionTrack, trackFromKeyframes, clipFromTracks } from '@scenes'

const track = vectorTrack('.position', [0, 1, 2], [0,0,0,  0,2,0,  0,0,0])
const clip  = clipFromTracks('hop', 2, [ track ])
```

## Playing an imported model's animations

```js
import { loadGLTF, createAnimationController } from '@scenes'

const { scene: model, animations } = await loadGLTF('models/robot.glb')
scene.add(model)
const ctrl = createAnimationController(model, animations, loop)
ctrl.play(animations[0].name, { loop: THREE.LoopRepeat })
```

`loadGLTF` (and `loadModel`) come from the `loaders` module — it wraps `GLTFLoader`
and lazily wires the optional DRACO / KTX2 / meshopt decoders:

```js
import { createGLTFLoader, loadGLTF, loadModel } from '@scenes'
const loader = createGLTFLoader({ draco: true, renderer })  // detectSupport for KTX2
const model  = await loadModel('models/tree.glb')           // dispatch by extension, cached
```

Props (see [props-and-factories.md](./props-and-factories.md)) wrap this automatically:
a `<Prop src="robot.glb">` loads the model and plays its baked clips for you.

## Perf

One mixer per animated root. `mixer.update` is cheap; cost scales with active tracks.
Crossfades blend on the CPU and free the faded-out action. Dispose controllers on
teardown — see [production-lessons.md](./production-lessons.md) on disposal.
