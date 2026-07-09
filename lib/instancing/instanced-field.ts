// lib/instancing/instanced-field.ts
// InstancedMesh field. One geometry × N transforms. Use for grass, trees,
// asteroids, bullets, voxels, prop scatter. Ported from
// scripts/instancing-grass.js. A custom `place` callback can override the
// default seeded radial scatter for arbitrary placement.

import * as THREE from 'three'

import { mulberry32 } from '../procedural/rng.js'


// perf: module-scope scratch — no per-instance allocation.
const scratchObject = new THREE.Object3D()
const scratchColor  = new THREE.Color()

/** Scratch pair handed to a {@link PlaceFn}: set the `object` transform and instance `color`. */
export interface InstancePlacement {
  object: THREE.Object3D
  color:  THREE.Color
}

/** Places instance `index`: mutate `object` position/rotation/scale and `color`; `rng` is the field's seeded stream. */
export type PlaceFn = (
  index: number,
  rng: () => number,
  object: THREE.Object3D,
  color: THREE.Color,
) => void

/** Options for {@link createInstancedField}: geometry/material/count plus seeded scatter tuning (radius, hue, scale) or a custom `place`. */
export interface InstancedFieldOptions {
  geometry:   THREE.BufferGeometry
  material:   THREE.Material
  count:      number
  radius?:    number
  seed?:      number
  hueBase?:   number
  hueSpread?: number
  scaleMin?:  number
  scaleMax?:  number
  place?:     PlaceFn
}

/**
 * One geometry × N transforms as a single `InstancedMesh` draw call — grass,
 * trees, asteroids, bullets, scatter. Default placement is a seeded radial
 * scatter with per-instance hue/scale variation; pass `place` for arbitrary
 * layouts.
 *
 * @param options - Geometry, material, `count` (buffers size once), and
 * placement tuning.
 * @returns The `InstancedMesh` with per-instance colors enabled.
 * @remarks Same `seed` → identical field. One draw call regardless of count.
 */
export function createInstancedField ({
  geometry,
  material,
  count,
  radius = 10,
  seed = 1,
  hueBase = 0.25,
  hueSpread = 0.1,
  scaleMin = 0.7,
  scaleMax = 1.3,
  place,
}: InstancedFieldOptions): THREE.InstancedMesh {
  const mesh = new THREE.InstancedMesh(geometry, material, count)
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage)
  // a single big InstancedMesh defeats per-instance culling — disable.
  mesh.frustumCulled = false

  const rng = mulberry32(seed)
  for (let i = 0; i < count; i++) {
    if (place)
      place(i, rng, scratchObject, scratchColor)
    else {
      const angle = rng() * Math.PI * 2
      const dist  = Math.sqrt(rng()) * radius
      scratchObject.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
      scratchObject.rotation.y = rng() * Math.PI * 2
      scratchObject.scale.setScalar(scaleMin + rng() * (scaleMax - scaleMin))
      scratchColor.setHSL(hueBase + rng() * hueSpread, 0.6, 0.35 + rng() * 0.2)
    }
    scratchObject.updateMatrix()
    mesh.setMatrixAt(i, scratchObject.matrix)
    mesh.setColorAt(i, scratchColor)
  }
  mesh.instanceMatrix.needsUpdate = true
  if (mesh.instanceColor)
    mesh.instanceColor.needsUpdate = true

  return mesh
}

// perf: medium-cheap. 1 draw call for the entire field; matrix upload happens
// once at init. Memory: ~16 bytes per instance for transform + 12 for color.
