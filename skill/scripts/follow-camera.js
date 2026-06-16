// scripts/follow-camera.js
// Third-person follow camera with framerate-independent damping.
// Lerp with `1 - exp(-k * delta)` so behavior is consistent regardless of FPS.

import * as THREE from 'three'

const scratchTargetPos = new THREE.Vector3()
const scratchLookAt    = new THREE.Vector3()
const scratchDesired   = new THREE.Vector3()

export function createFollowCamera (camera, target, {
  offset,
  lookAhead = new THREE.Vector3(),
  stiffness = 8,
  rotationStiffness = 6,
} = {}) {
  if (!offset) throw new Error('createFollowCamera: offset is required')

  return ({ delta }) => {
    target.getWorldPosition(scratchTargetPos)
    scratchDesired
      .copy(offset)
      .applyQuaternion(target.quaternion)
      .add(scratchTargetPos)

    const tPos = 1 - Math.exp(-stiffness * delta)
    camera.position.lerp(scratchDesired, tPos)

    scratchLookAt
      .copy(lookAhead)
      .applyQuaternion(target.quaternion)
      .add(scratchTargetPos)
    const tLook = 1 - Math.exp(-rotationStiffness * delta)
    scratchLookAt.lerp(scratchTargetPos, tLook)
    camera.lookAt(scratchLookAt)
  }
}

// perf: cheap. three scratch vectors at module scope; zero per-frame alloc.
