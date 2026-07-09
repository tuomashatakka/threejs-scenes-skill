// lib/instancing/batched-buildings.ts
// BatchedMesh — N different geometries, ONE shared material. Use for city
// buildings, dungeon pieces, mixed props. Instance ids are individually
// hideable via setVisibleAt(id, bool). Ported from scripts/batched-buildings.js.

import * as THREE from 'three'


/** Options for {@link createBatchedBuildings}: the geometry variants, ONE shared material, and per-instance transforms. */
export interface BatchedBuildingsOptions {
  geometries:              THREE.BufferGeometry[]
  material:                THREE.Material
  transforms:              THREE.Matrix4[]
  sortObjects?:            boolean
  perObjectFrustumCulled?: boolean
}

/**
 * Batch N different geometries under one shared material into a single
 * `BatchedMesh` draw call — city buildings, dungeon pieces, mixed props.
 *
 * @param options - Geometries, shared material, and one `Matrix4` per
 * instance (geometry `i % geometries.length` is used for transform `i`).
 * @returns The `BatchedMesh`; hide individual instances with
 * `setVisibleAt(id, false)`.
 * @remarks Buffers are sized once from the total vertex/index counts.
 * @see {@link createInstancedField} for the one-geometry × N case.
 */
export function createBatchedBuildings ({
  geometries,
  material,
  transforms,
  sortObjects = false,
  perObjectFrustumCulled = true,
}: BatchedBuildingsOptions): THREE.BatchedMesh {
  const totalVerts = geometries.reduce((s, g) => s + g.attributes.position.count, 0)
  const totalIndex = geometries.reduce((s, g) => s + (g.index?.count ?? 0), 0)

  const batch                  = new THREE.BatchedMesh(transforms.length, totalVerts, totalIndex, material)
  batch.sortObjects            = sortObjects
  batch.perObjectFrustumCulled = perObjectFrustumCulled

  const geometryIds = geometries.map(g => batch.addGeometry(g))
  for (let i = 0; i < transforms.length; i++) {
    const geometryId = geometryIds[i % geometryIds.length] as number
    const instanceId = batch.addInstance(geometryId)
    batch.setMatrixAt(instanceId, transforms[i] as THREE.Matrix4)
  }
  return batch
}

// perf: medium-cheap. 1 draw call for the whole batch.
// Memory: total vertex + index buffer is allocated upfront. Plan capacity.
