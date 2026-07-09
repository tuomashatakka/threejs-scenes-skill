// lib/post/webgpu/pixel.ts
// Pixelation — renders the scene into chunky pixels with optional normal/depth
// edge outlines, a crisp retro / voxel-art look. Wraps three's pixelationPass,
// which is itself a PassNode (it renders the scene), so use it INSTEAD of a plain
// scene pass. Pattern: SCENE PASS replacement; use the returned node as output.

import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js'




/** Options for {@link createPixelationPass}: pixel block size and normal/depth edge-darkening strength. */
export interface PixelOptions {
  // Size of each output pixel block in device pixels.
  pixelSize?:          number
  // Strength of normal-discontinuity edge darkening.
  normalEdgeStrength?: number
  // Strength of depth-discontinuity edge darkening.
  depthEdgeStrength?:  number
}



/**
 * Render the scene into chunky pixel blocks with optional normal-discontinuity and depth-discontinuity edge outlines.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @param options.pixelSize - Size of each output pixel block in device pixels. Default `6`.
 * @param options.normalEdgeStrength - Strength of normal-discontinuity edge darkening. Default `0.3`.
 * @param options.depthEdgeStrength - Strength of depth-discontinuity edge darkening. Default `0.4`.
 * @returns A {@link PassNode} producing the pixelated output. Use this INSTEAD of a plain scene pass.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — renders the scene at reduced resolution plus an edge-detect pass.
 */
export function createPixelationPass (scene: THREE.Scene, camera: THREE.Camera, options: PixelOptions = {}) {
  const { pixelSize = 6, normalEdgeStrength = 0.3, depthEdgeStrength = 0.4 } = options
  return pixelationPass(scene, camera, uniform(pixelSize), uniform(normalEdgeStrength), uniform(depthEdgeStrength))
}

// perf: medium. Renders the scene at reduced resolution plus an edge-detect pass.
