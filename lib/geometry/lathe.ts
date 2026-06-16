// lib/geometry/lathe.ts
// Lathe (surface-of-revolution) meshes — vases, bottles, columns, lamp bodies.
// Feed a half-profile (x = radius, y = height) and it revolves around Y.

import * as THREE from 'three'


export interface LatheOptions {
  segments?:  number
  phiStart?:  number
  phiLength?: number
  material?:  THREE.Material
}

export function createLatheMesh (
  profile: ReadonlyArray<readonly [number, number] | THREE.Vector2>,
  options: LatheOptions = {},
): THREE.Mesh {
  const {
    segments = 32,
    phiStart = 0,
    phiLength = Math.PI * 2,
    material = new THREE.MeshStandardMaterial({ color: '#c0c8d0', roughness: 0.5, metalness: 0.2 }),
  } = options

  const pts = profile.map(p =>
    p instanceof THREE.Vector2 ? p : new THREE.Vector2(p[0], p[1]))

  const geometry = new THREE.LatheGeometry(pts, segments, phiStart, phiLength)
  geometry.computeVertexNormals()

  const mesh      = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  return mesh
}

// perf: medium. One draw call. Profile point count × segments = vertex count —
// keep the profile lean (8–16 points is plenty for most silhouettes).
