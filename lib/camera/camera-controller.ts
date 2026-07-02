// lib/camera/camera-controller.ts
// Multi-mode camera state machine: free | flyTo | follow | cockpit. All motion
// is framerate-independent exp-easing (t = 1 - exp(-k * delta)), FOV tweens the
// same way, and fly-to targets are serializable tuples so camera intent can
// live in app state (see ./targets.ts). Generalized from the stellar-cartogrph
// CameraController.

import * as THREE from 'three'

import { tupleToVector3 } from './targets.js'
import type { Vec3Tuple } from './targets.js'
import type { FrameContext } from '../types.js'


export type CameraMode = 'free' | 'flyTo' | 'follow' | 'cockpit'

export interface CameraBounds {
  min: Vec3Tuple
  max: Vec3Tuple
}

export interface CameraControllerOptions {

  /** Position easing rate (higher = snappier). */
  stiffness?:     number
  lookStiffness?: number
  fovStiffness?:  number

  /** Distance at which a fly-to counts as arrived. */
  arriveEpsilon?: number
  bounds?:        CameraBounds | null
}

export interface FlyToOptions {
  speed?:    number
  fov?:      number
  onArrive?: () => void
}

export interface CameraController {
  readonly camera: THREE.PerspectiveCamera
  mode (): CameraMode

  /** Ease toward a position + look-at; fires onArrive once, then goes free. */
  flyTo (position: Vec3Tuple, lookAt: Vec3Tuple, options?: FlyToOptions): void

  /** Track an object, keeping `offset` in its local frame. */
  follow (object: THREE.Object3D, offset?: Vec3Tuple): void

  /** Anchor to a rig Object3D (first-person): copies its world transform. */
  cockpit (rig: THREE.Object3D): void
  free (): void
  setFov (fov: number): void
  setBounds (bounds: CameraBounds | null): void
  snapTo (position: Vec3Tuple, lookAt: Vec3Tuple): void
  isMoving (): boolean
  update (ctx: FrameContext): void
}

const desiredPos  = new THREE.Vector3()
const desiredLook = new THREE.Vector3()
const currentLook = new THREE.Vector3()
const worldPos    = new THREE.Vector3()
const worldQuat   = new THREE.Quaternion()

export function createCameraController (
  camera: THREE.PerspectiveCamera,
  {
    stiffness = 4,
    lookStiffness = 5,
    fovStiffness = 6,
    arriveEpsilon = 0.05,
    bounds = null,
  }: CameraControllerOptions = {},
): CameraController {
  let mode: CameraMode                    = 'free'
  let speedScale                          = 1
  let targetFov                           = camera.fov
  let onArrive: (() => void) | null       = null
  let followTarget: THREE.Object3D | null = null
  let cockpitRig: THREE.Object3D | null   = null
  let activeBounds                        = bounds

  const followOffset = new THREE.Vector3(0, 2, 6)
  const goalPos      = new THREE.Vector3()
  const goalLook     = new THREE.Vector3()

  // seed the look point from the current camera direction
  camera.getWorldDirection(currentLook).add(camera.position)

  function clampToBounds (v: THREE.Vector3): void {
    if (!activeBounds)
      return
    v.x = Math.min(Math.max(v.x, activeBounds.min[0]), activeBounds.max[0])
    v.y = Math.min(Math.max(v.y, activeBounds.min[1]), activeBounds.max[1])
    v.z = Math.min(Math.max(v.z, activeBounds.min[2]), activeBounds.max[2])
  }

  function update ({ delta }: FrameContext): void {
    // FOV tween runs in every mode
    if (Math.abs(camera.fov - targetFov) > 0.01) {
      camera.fov += (targetFov - camera.fov) * (1 - Math.exp(-fovStiffness * delta))
      camera.updateProjectionMatrix()
    }

    if (mode === 'free')
      return

    if (mode === 'cockpit' && cockpitRig) {
      cockpitRig.getWorldPosition(worldPos)
      cockpitRig.getWorldQuaternion(worldQuat)

      const t = 1 - Math.exp(-stiffness * 3 * delta)
      camera.position.lerp(worldPos, t)
      camera.quaternion.slerp(worldQuat, t)
      return
    }

    if (mode === 'follow' && followTarget) {
      followTarget.getWorldPosition(worldPos)
      desiredPos.copy(followOffset).applyQuaternion(followTarget.quaternion)
        .add(worldPos)
      desiredLook.copy(worldPos)
    }
    else {
      desiredPos.copy(goalPos)
      desiredLook.copy(goalLook)
    }
    clampToBounds(desiredPos)

    const tPos  = 1 - Math.exp(-stiffness * speedScale * delta)
    const tLook = 1 - Math.exp(-lookStiffness * speedScale * delta)
    camera.position.lerp(desiredPos, tPos)
    currentLook.lerp(desiredLook, tLook)
    camera.lookAt(currentLook)

    if (mode === 'flyTo' && camera.position.distanceTo(desiredPos) < arriveEpsilon) {
      mode = 'free'

      const cb = onArrive
      onArrive = null
      cb?.()
    }
  }

  return {
    camera,
    mode: () => mode,
    flyTo (position, lookAt, options = {}) {
      tupleToVector3(position, goalPos)
      tupleToVector3(lookAt, goalLook)
      speedScale = options.speed ?? 1
      if (options.fov !== undefined)
        targetFov = options.fov
      onArrive = options.onArrive ?? null
      mode     = 'flyTo'
    },
    follow (object, offset) {
      followTarget = object
      if (offset)
        followOffset.set(offset[0], offset[1], offset[2])
      mode = 'follow'
    },
    cockpit (rig) {
      cockpitRig = rig
      mode       = 'cockpit'
    },
    free () {
      mode = 'free'
    },
    setFov (fov) {
      targetFov = fov
    },
    setBounds (next) {
      activeBounds = next
    },
    snapTo (position, lookAt) {
      tupleToVector3(position, camera.position)
      tupleToVector3(lookAt, currentLook)
      camera.lookAt(currentLook)
      mode = 'free'
    },
    isMoving: () => mode !== 'free',
    update,
  }
}

// perf: cheap. module-scope scratch vectors, zero per-frame alloc.
