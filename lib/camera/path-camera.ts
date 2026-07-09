// lib/camera/path-camera.ts
// On-rails camera with pointer look-around, ported from shaders-fr's
// CameraRig. Advances a distance along a curve, looks down the tangent, and
// layers an exp-smoothed yaw/pitch pan driven by pointer position — the pan
// recenters when the pointer lifts. Uses getPoint (parameter-based), not
// getPointAt: the arc-length cache can NaN out on freshly rebuilt curves.

import * as THREE from 'three'

import type { Disposable, FrameContext } from '../types.js'


/** Tuning for {@link createPathCamera}: look-around ranges (radians), look smoothing, and travel speed. */
export interface PathCameraOptions {

  /** Max look-around yaw in radians. Default 0.25 (~14°). */
  yawRange?: number

  /** Max look-around pitch in radians. Default 0.18. */
  pitchRange?: number

  /** Look smoothing rate (higher = snappier). Default 6. */
  smoothing?: number

  /** Units per second along the curve. Default 2. */
  speed?: number
}

/** What a path camera rides: a curve plus its total length. `SegmentStream` satisfies it. */
export interface PathCameraSource {

  /** Current path curve. May be swapped/rebuilt between frames. */
  curve: THREE.Curve<THREE.Vector3> & { points?: THREE.Vector3[] }

  /** Total path length in world units. */
  total: number
}

/** Handle returned by {@link createPathCamera}. `distance` is writable for seeking; `dispose()` removes the pointer listeners. */
export interface PathCamera extends Disposable {

  /** Distance travelled along the curve (writable for seeking). */
  distance: number

  /** Advance and orient the camera. Call once per frame. */
  update (ctx: FrameContext, speedOverride?: number): void
}

/**
 * Rail-riding camera: advances `distance` along the source curve at `speed`,
 * orients along the tangent, and layers smoothed pointer look-around within
 * the yaw/pitch ranges.
 *
 * @param camera - Perspective camera to drive.
 * @param source - Curve + total length; may be swapped between frames
 * (segment streams rebuild it as segments append).
 * @param element - Element whose pointer movement drives look-around.
 * @param options - Ranges, smoothing, and speed.
 * @returns A {@link PathCamera}; call `update(ctx)` once per frame.
 */
export function createPathCamera (
  camera: THREE.PerspectiveCamera,
  path: PathCameraSource,
  element: HTMLElement,
  { yawRange = 0.25, pitchRange = 0.18, smoothing = 6, speed = 2 }: PathCameraOptions = {},
): PathCamera {
  let targetYaw   = 0
  let targetPitch = 0
  let yaw         = 0
  let pitch       = 0

  const onMove = (e: PointerEvent): void => {
    const nx = e.clientX / window.innerWidth * 2 - 1
    const ny = e.clientY / window.innerHeight * 2 - 1
    targetYaw   = -nx * yawRange
    targetPitch = -ny * pitchRange
  }
  const onUp = (): void => {
    targetYaw   = 0
    targetPitch = 0
  }
  element.addEventListener('pointermove', onMove)
  element.addEventListener('pointerup', onUp)
  element.addEventListener('pointercancel', onUp)

  const pos     = new THREE.Vector3()
  const ahead   = new THREE.Vector3()
  const tangent = new THREE.Vector3()
  const look    = new THREE.Vector3()

  const rig: PathCamera = {
    distance: 0,

    update ({ delta }: FrameContext, speedOverride?: number): void {
      rig.distance += delta * (speedOverride ?? speed)

      const { curve, total } = path
      if (total <= 0.001 || !curve || curve.points && curve.points.length < 2)
        return

      const d = Math.min(rig.distance, total - 0.01)

      const u = Math.max(0, Math.min(d / total, 0.999))
      curve.getPoint(u, pos)
      curve.getPoint(Math.min(u + 0.002, 1), ahead)
      tangent.subVectors(ahead, pos)
      if (tangent.lengthSq() < 1e-6)
        tangent.set(0, 0, 1)
      tangent.normalize()

      camera.position.copy(pos)

      const k = 1 - Math.exp(-delta * smoothing)
      yaw   += (targetYaw - yaw) * k
      pitch += (targetPitch - pitch) * k

      look.copy(pos).add(tangent)
      camera.lookAt(look)
      camera.rotateY(yaw)
      camera.rotateX(pitch)
    },

    dispose (): void {
      element.removeEventListener('pointermove', onMove)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointercancel', onUp)
    },
  }

  return rig
}

// perf: cheap — two curve samples and four temp vectors per frame, zero
// allocations in update(). Pairs with createSegmentStream for endless rails.
