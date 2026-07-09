// lib/architecture/pick.ts
// Raycast + walk-to-scene-direct-child introspection. Tag top-level objects
// with obj.userData.module = name when adding them; a click-to-inspect
// raycaster then walks object.parent up to the scene's direct child and maps a
// hit back to its owning module — no separate registry needed
// (the metadata-tagging lesson in production-lessons.md).

import * as THREE from 'three'


const raycaster = new THREE.Raycaster()
const pointer   = new THREE.Vector2()

/** Predicate limiting which objects a raycast pick may hit. */
export type PickFilter = (object: THREE.Object3D) => boolean

/** A raycast hit: the leaf `object`, its `topLevel` scene-direct-child ancestor, world `point`, and ray `distance`. */
export interface PickResult {
  object:   THREE.Object3D
  topLevel: THREE.Object3D
  point:    THREE.Vector3
  distance: number
}

/**
 * Raycast from NDC pointer coordinates and walk the first accepted hit up to
 * the scene's direct child. Tag top-level objects with
 * `userData.module = name` and this maps any hit back to its owning module —
 * no separate registry needed.
 *
 * @param scene - Scene whose children are cast against (recursive).
 * @param camera - Camera defining the pick ray.
 * @param ndcX - Pointer X in normalized device coordinates [-1, 1].
 * @param ndcY - Pointer Y in normalized device coordinates [-1, 1].
 * @param isPickable - Optional filter; rejected hits fall through to the next.
 * @returns The first accepted {@link PickResult}, or `null` when nothing hit.
 * @see {@link pick} for the distortion-aware variant.
 */
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

/** Options for {@link pick}: hit filter, screen-distortion inverse, and cast-root scoping. */
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

/**
 * Click-vs-drag discrimination: call `down(x, y)` on pointerdown and
 * `isClick(x, y)` on pointerup — `true` only when the pointer moved less
 * than `thresholdPx` pixels between the two.
 *
 * @param thresholdPx - Max travel in CSS pixels still counted as a click.
 * @returns A `{ down, isClick }` pair.
 */
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
