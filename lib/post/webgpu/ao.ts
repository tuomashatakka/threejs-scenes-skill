// lib/post/webgpu/ao.ts
// Ambient occlusion (GTAO) — contact shadows in creases. Wraps three's GTAONode.
// Pattern: GEOMETRY-AWARE effect. Needs depth + normal from an MRT scene pass
// (see createScenePassMRT) and the camera. Multiply onto the scene colour.

import * as THREE from 'three'
import { ao } from 'three/addons/tsl/display/GTAONode.js'
import type { ColorNode } from './types.js'


/** Wrap a GTAONode that computes screen-space ambient occlusion from viewZ and normal, producing contact shadows in creases. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. Needs depth + normal from an MRT scene pass (createScenePassMRT). */
export function createAo (viewZ: ColorNode, normal: ColorNode, camera: THREE.Camera) {
  return ao(viewZ, normal, camera)
}

// perf: high. Hemisphere sampling per pixel; gate off on low-end devices.
