// lib/post/webgpu/smaa.ts
// SMAA — subpixel morphological anti-aliasing, higher quality edges than FXAA.
// Wraps three's SMAANode. Pattern: COLOUR-INPUT effect; apply on the scene
// colour as the output node.

import { smaa } from 'three/addons/tsl/display/SMAANode.js'
import type { ColorNode } from './types.js'


/** Wrap an SMAANode that applies subpixel morphological anti-aliasing with higher-quality edges than FXAA. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createSmaa (input: ColorNode) {
  return smaa(input)
}

// perf: low-medium. Edge + blend-weight passes using two precomputed lookups.
