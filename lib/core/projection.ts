// lib/core/projection.ts
// World -> screen projection for effect targeting: feed a selected object's
// screen UV to lens-flare / lensing / vortex uniforms each frame, and skip the
// effect when the object is off-screen or behind the camera.

import * as THREE from 'three'


/**
 * Screen-space projection result from {@link projectToScreenUv}. Feed `u`/`v`
 * to effect uniforms and gate the effect on `onScreen`.
 */
export interface ScreenProjection {

  /** Screen position in 0..1 UV space (0,0 = bottom-left, matches shader vUv). */
  u: number
  v: number

  /** NDC depth; > 1 means beyond far plane, < -1 in front of near. */
  ndcZ:     number

  /** True when the point is in front of the camera and inside the 0..1 UV rect. */
  onScreen: boolean
}

const scratch     = new THREE.Vector3()
const scratchView = new THREE.Vector3()

/**
 * Project an object's world position to 0..1 screen UV space for effect
 * targeting (lens flares, lensing, vortex centers). Points behind the camera
 * are detected in view space — a plain `Vector3.project()` folds them into
 * valid-looking NDC — and reported as `onScreen: false`.
 *
 * @param object - Object whose world position is projected; its world matrix must be current.
 * @param camera - Camera defining the projection.
 * @param out - Optional result object to fill; pass a reused one for zero per-frame allocation.
 * @returns The filled {@link ScreenProjection} (the same `out` instance when provided).
 */
export function projectToScreenUv (
  object: THREE.Object3D,
  camera: THREE.Camera,
  out: ScreenProjection = { u: 0, v: 0, ndcZ: 0, onScreen: false },
): ScreenProjection {
  object.getWorldPosition(scratch)

  // behind-the-camera check must happen in view space: project() folds points
  // behind the eye back into valid-looking NDC.
  const behind = scratchView.copy(scratch).applyMatrix4(camera.matrixWorldInverse).z > 0
  scratch.project(camera)

  out.u        = scratch.x * 0.5 + 0.5
  out.v        = scratch.y * 0.5 + 0.5
  out.ndcZ     = scratch.z
  out.onScreen = !behind && out.u >= 0 && out.u <= 1 && out.v >= 0 && out.v <= 1
  return out
}

// perf: cheap. module-scope scratch vectors, zero per-frame alloc when a
// reused `out` is passed.
