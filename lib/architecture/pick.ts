// lib/architecture/pick.ts
// Raycast + walk-to-scene-direct-child introspection. Tag top-level objects
// with obj.userData.module = name when adding them; a click-to-inspect
// raycaster then walks object.parent up to the scene's direct child and maps a
// hit back to its owning module — no separate registry needed
// (the metadata-tagging lesson in production-lessons.md).

import * as THREE from 'three'


const raycaster = new THREE.Raycaster()
const pointer   = new THREE.Vector2()

export type PickFilter = (object: THREE.Object3D) => boolean

export interface PickResult {
  object:   THREE.Object3D
  topLevel: THREE.Object3D
  point:    THREE.Vector3
  distance: number
}

export function pickTopLevel (
  scene: THREE.Scene,
  camera: THREE.Camera,
  ndcX: number,
  ndcY: number,
  isPickable?: PickFilter,
): PickResult | null {
  pointer.set(ndcX, ndcY)
  raycaster.setFromCamera(pointer, camera)

  const hits = raycaster.intersectObjects(scene.children, true)
  for (const hit of hits) {
    if (isPickable && !isPickable(hit.object))
      continue

    // walk up to the scene's direct child.
    let top: THREE.Object3D = hit.object
    while (top.parent && top.parent !== scene)
      top = top.parent
    return { object: hit.object, topLevel: top, point: hit.point, distance: hit.distance }
  }
  return null
}

// perf: medium. raycast cost scales with scene depth; gate behind pointer taps.
