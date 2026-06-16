// lib/post/webgpu/ao.ts
// Ambient occlusion (GTAO) — contact shadows in creases. Wraps three's GTAONode.
// Pattern: GEOMETRY-AWARE effect. Needs depth + normal from an MRT scene pass
// (see createScenePassMRT) and the camera. Multiply onto the scene colour.

import * as THREE from 'three'
import { ao } from 'three/addons/tsl/display/GTAONode.js'
import type { ColorNode } from './types.js'


export function createAo (viewZ: ColorNode, normal: ColorNode, camera: THREE.Camera) {
  return ao(viewZ, normal, camera)
}

// perf: high. Hemisphere sampling per pixel; gate off on low-end devices.
