// lib/post/webgpu/sobel.ts
// Sobel edge detection — outlines via the Sobel gradient operator. Wraps three's
// SobelOperatorNode. Pattern: COLOUR-INPUT effect. The example feeds it
// `renderOutput(scenePass)` and uses the result directly as output.

import { sobel } from 'three/addons/tsl/display/SobelOperatorNode.js'
import type { ColorNode } from './types.js'




/**
 * Detect edges in the input using the Sobel 3x3 gradient operator.
 *
 * @param input - Colour node to process (typically display-space renderOutput).
 * @returns A SobelOperatorNode producing an edge-highlighted output.
 * @remarks Requires the WebGPU renderer (three/webgpu). Low cost — nine texture taps (3x3 kernel) per pixel.
 */
export function createSobel (input: ColorNode) {
  return sobel(input)
}

// perf: low. Nine taps (3x3 kernel) per pixel.
