// lib/post/webgpu/afterimage.ts
// After-image / echo trail — blends each frame with a damped copy of the last,
// leaving motion ghosts. Wraps three's AfterImageNode. Pattern: COLOUR-INPUT
// effect that keeps its own history target. Use the result as the output node.

import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js'
import type { ColorNode } from './types.js'


/** Options for {@link createAfterImage}. */
export interface AfterImageOptions {
  // Persistence of the previous frame, 0..1. Higher = longer trails.
  damp?: number
}

/** Wrap an AfterImageNode that blends each frame with a damped copy of the previous one, creating motion-ghost trails. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createAfterImage (input: ColorNode, options: AfterImageOptions = {}) {
  const { damp = 0.8 } = options
  return afterImage(input, damp)
}

// perf: low. One extra full-screen blend against a retained history texture.
