// lib/instancing/batched-buildings.ts
// BatchedMesh — N different geometries, ONE shared material. Use for city
// buildings, dungeon pieces, mixed props. Instance ids are individually
// hideable via setVisibleAt(id, bool). Ported from scripts/batched-buildings.js.

import * as THREE from 'three'


export interface BatchedBuildingsOptions {
  geometries:              THREE.BufferGeometry[]
  material:                THREE.Material
  transforms:              THREE.Matrix4[]
  sortObjects?:            boolean
  perObjectFrustumCulled?: boolean
}

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
