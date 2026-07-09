// lib/camera/iso-camera.ts
// Isometric camera factory. 'true-iso' uses 35.264° tilt (atan(1/√2));
// 'dimetric' uses 30° (game-style, more readable). Ported from
// scripts/iso-camera.js.

import * as THREE from 'three'


/** Iso projection flavor: `true-iso` tilts atan(1/√2) ≈ 35.26°, `dimetric` uses the game-friendly 30°. */
export type IsoFlavor = 'true-iso' | 'dimetric'

/** Options for {@link createIsoCamera}: vertical `viewSize` in world units, projection `flavor`, and near/far planes. */
export interface IsoCameraOptions {
  viewSize?: number
  flavor?:   IsoFlavor
  near?:     number
  far?:      number
}

interface IsoUserData {
  viewSize: number
  flavor:   IsoFlavor
}

/**
 * Orthographic isometric camera: positioned on a 45°-yaw tilted orbit and
 * sized so the frustum spans `viewSize` world units vertically. The chosen
 * `viewSize`/`flavor` are stored in `userData` so {@link resizeIsoCamera}
 * and zoom code can rebuild the frustum.
 *
 * @param aspect - Viewport width / height.
 * @param options - View size, flavor, near/far planes.
 * @returns A configured `OrthographicCamera` looking at the origin.
 */
export function createIsoCamera (aspect: number, {
  viewSize = 20,
  flavor = 'dimetric',
  near = 0.1,
  far = 500,
}: IsoCameraOptions = {}): THREE.OrthographicCamera {
  const h      = viewSize / 2
  const w      = h * aspect
  const camera = new THREE.OrthographicCamera(-w, w, h, -h, near, far)

  const tilt = flavor === 'true-iso'
    ? Math.atan(1 / Math.SQRT2)
    : THREE.MathUtils.degToRad(30)
  const radius = 100
  camera.position.set(
    Math.cos(THREE.MathUtils.degToRad(45)) * radius * Math.cos(tilt),
    Math.sin(tilt) * radius,
    Math.sin(THREE.MathUtils.degToRad(45)) * radius * Math.cos(tilt),
  )
  camera.lookAt(0, 0, 0)

  const data: IsoUserData  = { viewSize, flavor }
  camera.userData.viewSize = data.viewSize
  camera.userData.flavor   = data.flavor
  return camera
}

/** Rebuild an iso camera's frustum for a new aspect ratio (and any updated `userData.viewSize`), then update the projection matrix. */
export function resizeIsoCamera (camera: THREE.OrthographicCamera, aspect: number): void {
  const viewSize = camera.userData.viewSize as number
  const h        = viewSize / 2
  const w        = h * aspect
  camera.left    = -w; camera.right = w
  camera.top                        = h; camera.bottom = -h
  camera.updateProjectionMatrix()
}

// perf: cheap. one camera, zero per-frame work.
