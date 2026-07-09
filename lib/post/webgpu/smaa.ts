// lib/post/webgpu/smaa.ts
// SMAA — subpixel morphological anti-aliasing, higher quality edges than FXAA.
// Wraps three's SMAANode. Pattern: COLOUR-INPUT effect; apply on the scene
// colour as the output node.

import { smaa } from 'three/addons/tsl/display/SMAANode.js'
import type { ColorNode } from './types.js'




/**
 * Apply subpixel morphological anti-aliasing (SMAA) for higher-quality edge smoothing than FXAA.
 *
 * @param input - Colour node to anti-alias.
 * @returns An SMAANode producing the anti-aliased output.
 * @remarks Requires the WebGPU renderer (three/webgpu). Uses two precomputed edge-detection and blend-weight lookup textures. Low-medium cost.
 */
export function createSmaa (input: ColorNode) {
  return smaa(input)
}

// perf: low-medium. Edge + blend-weight passes using two precomputed lookups.
