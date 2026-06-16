// scripts/batched-buildings.js
// BatchedMesh — N different geometries, ONE shared material. Use for city
// buildings, dungeon pieces, mixed props. Instance ids are individually
// hideable via setVisibleAt(id, bool).

import * as THREE from 'three'


export function createBuildingBatch (geometries, material, transforms, {
  sortObjects = false,
  perObjectFrustumCulled = true,
} = {}) {
  const totalVerts = geometries.reduce((s, g) => s + g.attributes.position.count, 0)
  const totalIndex = geometries.reduce((s, g) => s + (g.index?.count ?? 0), 0)

  const batch                  = new THREE.BatchedMesh(transforms.length, totalVerts, totalIndex, material)
  batch.sortObjects            = sortObjects
  batch.perObjectFrustumCulled = perObjectFrustumCulled

  const geometryIds = geometries.map(g => batch.addGeometry(g))
  for (let i = 0; i < transforms.length; i++) {
    const instanceId = batch.addInstance(geometryIds[i % geometryIds.length])
    batch.setMatrixAt(instanceId, transforms[i])
  }
  return batch
}

// perf: medium-cheap. 1 draw call for the whole batch.
// Memory: total vertex + index buffer is allocated upfront. Plan capacity.
