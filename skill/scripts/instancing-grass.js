// scripts/instancing-grass.js
// InstancedMesh field. One geometry × N transforms. Use for grass, trees,
// asteroids, bullets, voxels, prop scatter.

import * as THREE from 'three'

import { mulberry32 } from './rng.js'


const scratchObject = new THREE.Object3D()
const scratchColor  = new THREE.Color()

export function createInstancedField (geometry, material, {
  count,
  radius,
  seed = 1,
  hueBase = 0.25,
  hueSpread = 0.1,
  scaleMin = 0.7,
  scaleMax = 1.3,
} = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
  // a single big InstancedMesh defeats per-instance culling — disable.
  mesh.frustumCulled = false

  const rng = mulberry32(seed)
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2
    const dist  = Math.sqrt(rng()) * radius
    scratchObject.position.set(
      Math.cos(angle) * dist,
      0,
      Math.sin(angle) * dist,
    )
    scratchObject.rotation.y = rng() * Math.PI * 2
    scratchObject.scale.setScalar(scaleMin + rng() * (scaleMax - scaleMin))
    scratchObject.updateMatrix()
    mesh.setMatrixAt(i, scratchObject.matrix)
    scratchColor.setHSL(hueBase + rng() * hueSpread, 0.6, 0.35 + rng() * 0.2)
    mesh.setColorAt(i, scratchColor)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor)
    mesh.instanceColor.needsUpdate = true

  return mesh
}

// perf: medium-cheap. 1 draw call for the entire field; matrix upload happens
// once at init. Memory: ~16 bytes per instance for transform + 12 for color.
