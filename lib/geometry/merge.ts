// lib/geometry/merge.ts
// Static-batch merging: collapse many meshes into one geometry to kill draw
// calls. Use when objects are static and share (a few) materials. For dynamic
// repeated objects prefer instancing (../instancing) instead.

import * as THREE from 'three'
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js'


/**
 * Merge `meshes` into a single Mesh when they share one material, or a Group of
 * merged meshes (one per distinct material) otherwise. Each mesh's local matrix
 * is baked into the merged geometry. The source meshes are left untouched.
 */
export function mergeMeshes (meshes: THREE.Mesh[]): THREE.Object3D {
  const byMaterial = new Map<THREE.Material, THREE.BufferGeometry[]>()

  for (const mesh of meshes) {
    const mat = mesh.material as THREE.Material
    mesh.updateMatrix()

    const geo = mesh.geometry.clone()
    geo.applyMatrix4(mesh.matrix)

    const list = byMaterial.get(mat) ?? []
    list.push(geo)
    byMaterial.set(mat, list)
  }

  const merged: THREE.Mesh[] = []
  for (const [ material, geos ] of byMaterial) {
    const geometry = BufferGeometryUtils.mergeGeometries(geos, false)
    geos.forEach(g => g.dispose())
    merged.push(new THREE.Mesh(geometry, material))
  }

  if (merged.length === 1)
    return merged[0] as THREE.Mesh

  const group = new THREE.Group()
  merged.forEach(m => group.add(m))
  return group
}

/** Merge a raw list of geometries (assumed already in a common space). */
export function mergeGeometryList (geometries: THREE.BufferGeometry[], useGroups = false): THREE.BufferGeometry {
  return BufferGeometryUtils.mergeGeometries(geometries, useGroups)
}

// perf: big win for static clutter — N meshes -> 1 (or #materials) draw calls.
// Trade-off: you lose per-object culling and can't move objects independently.
