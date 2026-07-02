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

export interface PickOptions {
  isPickable?: PickFilter

  /**
   * Screen-space distortion inverse, applied to the pointer NDC before the
   * raycast — required when a warping post pass (CRT curvature) is active so
   * hits match what's on screen. See post/webgl/crt.ts crtCorrectPointer.
   */
  distortion?: (ndcX: number, ndcY: number) => { x: number; y: number }

  /** Restrict the cast to these roots instead of the whole scene. */
  objects?: THREE.Object3D[]
}

/** pickTopLevel with a distortion hook + object scoping. */
export function pick (
  scene: THREE.Scene,
  camera: THREE.Camera,
  ndcX: number,
  ndcY: number,
  { isPickable, distortion, objects }: PickOptions = {},
): PickResult | null {
  const corrected = distortion ? distortion(ndcX, ndcY) : { x: ndcX, y: ndcY }
  pointer.set(corrected.x, corrected.y)
  raycaster.setFromCamera(pointer, camera)

  const hits = raycaster.intersectObjects(objects ?? scene.children, true)
  for (const hit of hits) {
    if (isPickable && !isPickable(hit.object))
      continue

    let top: THREE.Object3D = hit.object
    while (top.parent && top.parent !== scene)
      top = top.parent
    return { object: hit.object, topLevel: top, point: hit.point, distance: hit.distance }
  }
  return null
}

/**
 * Click-vs-drag discrimination: remembers pointerdown, reports a click only
 * when pointerup lands within `thresholdPx`.
 */
type CreateClickGuardReturnType = {
  down (x: number, y: number): void
  isClick (x: number, y: number): boolean
}

export function createClickGuard (thresholdPx = 10): CreateClickGuardReturnType {
  let downX = 0
  let downY = 0
  return {
    down (x, y) {
      downX = x
      downY = y
    },
    isClick: (x, y) => Math.hypot(x - downX, y - downY) < thresholdPx,
  }
}

// perf: medium. raycast cost scales with scene depth; gate behind pointer taps.
