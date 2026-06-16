// scripts/geometry-modifiers.js
// Vertex deformers + static-batch merging from the library's geometry module.
// '@tuomashatakka/threejs-scenes' maps to the local './lib/dist/' copy in an
// artifact (see references/library-local.md).

import * as THREE from 'three'

import {
  applyTwist, displaceByNoise, mergeMeshes, createStandardMaterial,
} from '@tuomashatakka/threejs-scenes'


export function makeTwistedBar (material = createStandardMaterial('plastic', { color: '#d94f9f' })) {
  const geo = new THREE.BoxGeometry(0.6, 2.4, 0.6, 2, 24, 2)
  applyTwist(geo, Math.PI, 'y')
  return new THREE.Mesh(geo, material)
}

export function makeNoiseRock (seed = 7) {
  const geo = displaceByNoise(new THREE.IcosahedronGeometry(1, 3), { amp: 0.25, freq: 1.2, seed })
  return new THREE.Mesh(geo, createStandardMaterial('matte', { color: '#8a7f72', flatShading: true }))
}

// Collapse several static primitives sharing one material into a single mesh.
export function mergeClutter (material = createStandardMaterial('metal')) {
  const meshes = [
    new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material),
    new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.5), material),
    new THREE.Mesh(new THREE.TetrahedronGeometry(0.8), material),
  ]
  meshes[1].position.set(1.5, 0, 0)
  meshes[2].position.set(-1.5, 0, 0)
  return mergeMeshes(meshes) // one geometry, one draw call
}

// perf: deformers are O(vertices) at build time. mergeMeshes trades per-object
// culling for fewer draw calls — use for static clutter only.
