// lib/post/webgpu/ao.ts
// Ambient occlusion (GTAO) — contact shadows in creases. Wraps three's GTAONode.
// Pattern: GEOMETRY-AWARE effect. Needs depth + normal from an MRT scene pass
// (see createScenePassMRT) and the camera. Multiply onto the scene colour.

import * as THREE from 'three'
import { ao } from 'three/addons/tsl/display/GTAONode.js'
import type { ColorNode } from './types.js'




/**
 * Compute screen-space ambient occlusion (GTAO) to produce contact shadows in creases and corners.
 *
 * @param viewZ - View-space Z-depth node from the scene pass (scenePass.getViewZNode()).
 * @param normal - View-space normal node from the scene pass.
 * @param camera - The active camera.
 * @returns A GTAONode that outputs an occlusion mask. Multiply onto the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Needs depth + normal from an MRT scene pass (see {@link createScenePassMRT}). High cost — hemisphere sampling per pixel; gate off on low-end devices.
 */
export function createAo (viewZ: ColorNode, normal: ColorNode, camera: THREE.Camera) {
  return ao(viewZ, normal, camera)
}

// perf: high. Hemisphere sampling per pixel; gate off on low-end devices.
