// scripts/prop-factory.js
// Prop factory usage: a "crystal" prop (mesh + light + animation clips) and a
// single-mesh "tree" prop that instances to one draw call. defineProp/createProp
// come from the library's props module. 'threejs-scenes' maps to
// the esm.sh package (version-pinned) in an artifact (see references/library.md).

import * as THREE from 'three'

import {
  defineProp, createProp, createInstancedProp, createStandardMaterial, spinClip, bobClip,
} from 'threejs-scenes'


export const crystalProp = defineProp({
  name:   'crystal',
  build:  () => new THREE.Mesh(
    new THREE.OctahedronGeometry(0.5, 0),
    createStandardMaterial('emissive', { emissive: '#79f7ff', emissiveIntensity: 3 }),
  ),
  lights: () => [ new THREE.PointLight('#79f7ff', 6, 6) ],
  clips:  () => [ spinClip('y', 4), bobClip(0.25, 2) ],
})

export const treeProp = defineProp({
  name:  'tree',
  build: () => new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.6, 6), createStandardMaterial('matte', { color: '#3f7d4f' })),
})

export function mountProps (ctx) {
  const crystal = createProp(crystalProp, ctx)            // clips auto-play, light parented
  const forest  = createInstancedProp(treeProp, { count: 120, radius: 12, seed: 5 }, ctx)
  ctx.scene.add(crystal.object, forest.object)
  return { crystal, forest, dispose () { crystal.dispose(); forest.dispose() } }
}

// perf: crystal = a few draw calls; the 120-tree forest is a single draw call
// (single-mesh prop -> InstancedMesh). Controllers tick on ctx.loop.
