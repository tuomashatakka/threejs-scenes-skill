// scripts/animation-controller.js
// AnimationMixer convenience layer: build programmatic clips, wire them into the
// frame loop, and crossfade between them. createAnimationController + clip
// builders come from the library's animation module.
// '@tuomashatakka/threejs-scenes' maps to the esm.sh package (version-pinned) in an
// artifact (see references/library.md).

import * as THREE from 'three'

import {
  createAnimationController, spinClip, bobClip, pulseScaleClip, combineClips,
} from '@tuomashatakka/threejs-scenes'


export function animateMesh (mesh, loop) {
  const spin = spinClip('y', 4)
  const bob  = combineClips('bob', [ bobClip(0.4, 2), pulseScaleClip(0.9, 1.1, 2) ])

  // passing `loop` auto-registers mixer.update(delta) on the render loop
  const ctrl = createAnimationController(mesh, [ spin, bob ], loop)
  ctrl.play('spin', { loop: THREE.LoopRepeat })

  let current = 'spin'
  function toggle () {
    const next = current === 'spin' ? 'bob' : 'spin'
    ctrl.crossfade(current, next, 0.6)
    current = next
  }

  return { controller: ctrl, toggle, dispose: () => ctrl.dispose() }
}

// perf: one mixer per animated root; mixer.update is cheap. Crossfades blend on
// the CPU and free the faded-out action.
