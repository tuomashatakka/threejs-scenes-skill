// lib/post/webgpu/ssaa.ts
// SSAA — supersampling anti-aliasing: renders the scene multiple times with
// jittered subpixel offsets and averages them for reference-quality edges.
// Wraps three's ssaaPass, a PassNode rendering the scene, so use it INSTEAD of a
// plain scene pass. Pattern: SCENE PASS replacement.

import * as THREE from 'three'
import { ssaaPass } from 'three/addons/tsl/display/SSAAPassNode.js'




/** Options for {@link createSsaaPass}: sample level and unbiased weighting toggle. */
export interface SsaaOptions {
  // 0..5; number of samples is 2^sampleLevel (level 4 = 16 samples).
  sampleLevel?: number
  // Distribute sample weights to avoid bias toward the centre sample.
  unbiased?:    boolean
}



/**
 * Render the scene at 2^sampleLevel jittered subpixel offsets and average them for reference-quality supersampling anti-aliasing.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @param options.sampleLevel - Sample-count exponent (0..5); level 4 = 16 samples.
 * @param options.unbiased - Distribute sample weights to avoid bias toward the centre sample.
 * @returns A {@link PassNode} producing the SSAA output. Use this INSTEAD of a plain scene pass.
 * @remarks Requires the WebGPU renderer (three/webgpu). Very high cost — renders the whole scene 2^sampleLevel times. Use for stills or high-end hardware, not real-time on mobile.
 */
export function createSsaaPass (scene: THREE.Scene, camera: THREE.Camera, options: SsaaOptions = {}) {
  const node = ssaaPass(scene, camera)
  if (options.sampleLevel !== undefined)
    node.sampleLevel = options.sampleLevel
  if (options.unbiased !== undefined)
    node.unbiased = options.unbiased
  return node
}

// perf: very high. Renders the whole scene 2^sampleLevel times; use for stills
// or high-end hardware, not real-time on mobile.
