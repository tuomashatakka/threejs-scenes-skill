// scripts/prop-composite.js
// Prop composite: assemble several props into one group with relative
// transforms and aggregate disposal. Builds a lamp = post + bulb + point light.
// 'threejs-scenes' maps to the esm.sh package (version-pinned) in an
// artifact (see references/library.md).

import * as THREE from 'three'

import {
  defineProp, createProp, createPropComposite, createStandardMaterial, pulseScaleClip,
} from 'threejs-scenes'


const postProp = defineProp({
  name:  'lamp-post',
  build: () => new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 3, 12), createStandardMaterial('metal')),
})

const bulbProp = defineProp({
  name:   'lamp-bulb',
  build:  () => new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 24), createStandardMaterial('emissive', { emissive: '#ffd98a', emissiveIntensity: 4 })),
  lights: () => [ new THREE.PointLight('#ffd98a', 8, 12) ],
  clips:  () => [ pulseScaleClip(0.95, 1.05, 3) ],
})

export function createLampComposite (ctx) {
  const post = createProp(postProp, ctx)
  const bulb = createProp(bulbProp, ctx)
  const lamp = createPropComposite([
    { prop: post, position: [ 0, 1.5, 0 ] },
    { prop: bulb, position: [ 0, 3, 0 ] },
  ])
  ctx.scene.add(lamp.object)
  return lamp // { object, parts, dispose }
}

// perf: a composite is just a Group — no extra draw cost. dispose() tears down
// every part (geometry, material, light, controller) exactly once.
