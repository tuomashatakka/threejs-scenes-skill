// scripts/jsx-scene.js
// Reactive JSX layer in hyperscript form (no build step). render() bootstraps +
// mounts the tree and drives reactivity from the main frame loop — function
// props are accessors re-read every frame, so reconciliation IS the render tick.
// In an artifact '@tuomashatakka/threejs-scenes/jsx' maps to the local
// './lib/dist/jsx/index.js' copy (see references/library-local.md).

import * as THREE from 'three'

import { render, h, signal } from '@tuomashatakka/threejs-scenes/jsx'


export function buildJsxScene (canvas) {
  const [ angle, setAngle ] = signal(0)
  const cyan = new THREE.MeshStandardMaterial({ color: '#79f7ff', flatShading: true })
  const pink = new THREE.MeshStandardMaterial({ color: '#ff7ad9', roughness: 0.3, metalness: 0.4 })

  const app = render(
    h('scene', { background: '#0a0a14' },
      h('camera', { type: 'perspective', position: [ 0, 2.5, 7 ], makeDefault: true }),
      h('light', { type: 'hemisphere', intensity: 0.7 }),
      h('light', { type: 'spot', position: [ 5, 8, 3 ], intensity: 60, penumbra: 0.4, castShadow: true }),
      // reactive: rotation is an accessor, re-evaluated each frame by the loop
      h('group', { rotation: () => [ 0, angle(), 0 ] },
        h('mesh', { geometry: new THREE.IcosahedronGeometry(1, 0), material: cyan, position: [ -1.8, 0, 0 ] }),
        h('mesh', { geometry: new THREE.TorusKnotGeometry(0.6, 0.2, 100, 16), material: pink, position: [ 1.8, 0, 0 ] }),
      ),
    ),
    { canvas, background: '#0a0a14' },
  )

  // a signal driven from the same loop feeds the reactive rotation prop
  app.loop.onFrame(({ delta }) => setAngle(a => a + delta * 0.6))
  return app // { scene, renderer, loop, getCamera, dispose }
}

// perf: one rAF, one render per frame; per-frame cost = #reactive-prop accessor
// calls. app.dispose() tears down the whole graph — no GPU leak on unmount.
