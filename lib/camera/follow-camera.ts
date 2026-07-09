// lib/camera/follow-camera.ts
// Third-person follow camera with framerate-independent damping. Wires into the
// CameraController interface for interchangeable control.

import * as THREE from 'three'
import { tupleToVector3 } from './targets.js'
import type { Vec3Tuple } from './targets.js'
import type { CameraController, CameraMode } from './camera-controller.js'
import type { FrameContext } from '../types.js'


const scratchTargetPos = new THREE.Vector3()
const scratchLookAt    = new THREE.Vector3()
const scratchDesired   = new THREE.Vector3()

/** Options for {@link createFollowCamera}: required local-frame `offset`, look-ahead point, and position/rotation damping stiffness. */
export interface FollowCameraOptions {
  offset:             THREE.Vector3
  lookAhead?:         THREE.Vector3
  stiffness?:         number
  rotationStiffness?: number
}

/**
 * Chase camera: keeps `offset` in the target's local frame and looks at a
 * `lookAhead` point ahead of it, both with framerate-independent exponential
 * damping.
 *
 * @param camera - Camera to move.
 * @param target - Object to chase; swap via the returned controller's `follow`.
 * @param options - Offset (required), look-ahead, and stiffness tuning.
 * @returns A `CameraController` locked to follow mode; call `update(ctx)`
 * every frame.
 * @throws Error when `offset` is missing.
 * @remarks Three scratch vectors per frame, zero allocation.
 */
export function createFollowCamera (
  camera: THREE.Camera,
  target: THREE.Object3D,
  {
    offset,
    lookAhead = new THREE.Vector3(),
    stiffness = 8,
    rotationStiffness = 6,
  }: FollowCameraOptions,
): CameraController {
  if (!offset)
    throw new Error('createFollowCamera: offset is required')

  let currentTarget: THREE.Object3D | null = target
  const currentOffset    = offset.clone()
  const currentLookAhead = lookAhead.clone()
  let mode: CameraMode = 'follow'

  const update = ({ delta }: FrameContext): void => {
    if (mode !== 'follow' || !currentTarget)
      return

    currentTarget.getWorldPosition(scratchTargetPos)
    scratchDesired
      .copy(currentOffset)
      .applyQuaternion(currentTarget.quaternion)
      .add(scratchTargetPos)

    const tPos = 1 - Math.exp(-stiffness * delta)
    camera.position.lerp(scratchDesired, tPos)

    scratchLookAt
      .copy(currentLookAhead)
      .applyQuaternion(currentTarget.quaternion)
      .add(scratchTargetPos)

    const tLook = 1 - Math.exp(-rotationStiffness * delta)
    scratchLookAt.lerp(scratchTargetPos, tLook)
    camera.lookAt(scratchLookAt)
  }

  return {
    camera,
    mode: () => mode,
    follow (object, nextOffset) {
      currentTarget = object
      if (nextOffset)
        currentOffset.set(nextOffset[0], nextOffset[1], nextOffset[2])
      mode = 'follow'
    },
    free () {
      mode = 'free'
    },
    flyTo (_position, _lookAt, _options) {
      // Free camera to allow fly-to or no-op
      mode = 'free'
    },
    cockpit (_rig) {
      mode = 'cockpit'
    },
    setFov (_fov) {
      // Perspective-specific, no-op for generic camera
    },
    setBounds (_bounds) {
      // No-op
    },
    snapTo (position, lookAt) {
      tupleToVector3(position, camera.position)
      tupleToVector3(lookAt, scratchLookAt)
      camera.lookAt(scratchLookAt)
      mode = 'free'
    },
    isMoving: () => mode !== 'free',
    update,
  }
}
