// lib/post/webgpu/ssaa.ts
// SSAA — supersampling anti-aliasing: renders the scene multiple times with
// jittered subpixel offsets and averages them for reference-quality edges.
// Wraps three's ssaaPass, a PassNode rendering the scene, so use it INSTEAD of a
// plain scene pass. Pattern: SCENE PASS replacement.

import * as THREE from 'three'
import { ssaaPass } from 'three/addons/tsl/display/SSAAPassNode.js'


/** Options for {@link createSsaaPass}. */
export interface SsaaOptions {
  // 0..5; number of samples is 2^sampleLevel (level 4 = 16 samples).
  sampleLevel?: number
  // Distribute sample weights to avoid bias toward the centre sample.
  unbiased?:    boolean
}

/** Wrap an ssaaPass PassNode that renders the scene at 2^sampleLevel jittered subpixel offsets and averages them for reference-quality anti-aliasing. Use INSTEAD of a plain scene pass. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
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
