// lib/camera/targets.ts
// Serializable camera-target helpers. Keep "where the camera wants to be" in
// app state as plain [x,y,z] tuples (JSON-safe, replayable); the camera
// controller lerps the live camera toward them. Decouples intent from motion.

import * as THREE from 'three'


export type Vec3Tuple = readonly [number, number, number]

/** A serializable camera intent: where to stand and what to look at. */
export interface CameraTarget {
  position: Vec3Tuple
  lookAt:   Vec3Tuple
}

export function tupleToVector3 (tuple: Vec3Tuple, out = new THREE.Vector3()): THREE.Vector3 {
  return out.set(tuple[0], tuple[1], tuple[2])
}

export function vector3ToTuple (v: THREE.Vector3): Vec3Tuple {
  return [ v.x, v.y, v.z ]
}

/** Frame an object: stand `distance` away along `direction`, look at its center. */
export function targetFromObject (
  object: THREE.Object3D,
  distance: number,
  direction: Vec3Tuple = [ 0.5, 0.35, 1 ],
): CameraTarget {
  const center = new THREE.Vector3()
  object.getWorldPosition(center)

  const dir = new THREE.Vector3(...direction).normalize()
    .multiplyScalar(distance)
  return {
    position: vector3ToTuple(center.clone().add(dir)),
    lookAt:   vector3ToTuple(center),
  }
}

// perf: cheap. tuples allocate only when a target is (re)computed, never per frame.
