// lib/post/webgpu/afterimage.ts
// After-image / echo trail — blends each frame with a damped copy of the last,
// leaving motion ghosts. Wraps three's AfterImageNode. Pattern: COLOUR-INPUT
// effect that keeps its own history target. Use the result as the output node.

import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js'
import type { ColorNode } from './types.js'




/** Options for {@link createAfterImage}: per-frame persistence dampening. */
export interface AfterImageOptions {
  // Persistence of the previous frame, 0..1. Higher = longer trails.
  damp?: number
}



/**
 * Blend each frame with a damped copy of itself, producing motion-ghost trails.
 *
 * @param input - Colour node to process (e.g. scene-pass output).
 * @param options.damp - Persistence of the previous frame, 0..1. Higher values produce longer trails. Default `0.8`.
 * @returns An AfterImageNode that keeps an internal history texture and blends frames.
 * @remarks Requires the WebGPU renderer (three/webgpu). Low cost — one extra full-screen blend against a retained history texture.
 */
export function createAfterImage (input: ColorNode, options: AfterImageOptions = {}) {
  const { damp = 0.8 } = options
  return afterImage(input, damp)
}

// perf: low. One extra full-screen blend against a retained history texture.
