// lib/post/webgpu/retro.ts
// Retro / PSX pass — low-resolution rendering, vertex snapping and affine
// texture distortion emulating 5th-gen console hardware. Wraps three's
// retroPass, which is a PassNode that renders the scene, so use it INSTEAD of a
// plain scene pass. Pattern: SCENE PASS replacement; use the node as output.

import * as THREE from 'three'
import type { Node } from 'three/webgpu'
import { retroPass } from 'three/addons/tsl/display/RetroPassNode.js'




/** Options for {@link createRetroPass}: optional affine-distortion node and texture-filtering toggle. */
export interface RetroOptions {
  // Optional node controlling affine (perspective-incorrect) texture distortion.
  affineDistortion?: Node | null
  // Whether textures are filtered (false = nearest, more authentic).
  filterTextures?:   boolean
}



/**
 * Render the scene in a retro 5th-gen console style: low resolution, vertex snapping, and optional affine (perspective-incorrect) texture distortion.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @param options.affineDistortion - Optional TSL node controlling affine texture distortion. Pass null to disable.
 * @param options.filterTextures - Whether textures use bilinear filtering (true) or nearest (false, more authentic).
 * @returns A {@link PassNode} producing the retro-styled output. Use this INSTEAD of a plain scene pass.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — renders the scene at low resolution with custom vertex/fragment node injection.
 */
export function createRetroPass (scene: THREE.Scene, camera: THREE.Camera, options: RetroOptions = {}) {
  return retroPass(scene, camera, options)
}

// perf: medium. Renders the scene at low resolution with custom vertex/fragment
// node injection.
