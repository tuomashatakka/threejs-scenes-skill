// lib/post/webgpu/difference.ts
// Frame difference — boosts saturation where the current frame differs from the
// previous one, highlighting motion. No dedicated node exists; this mirrors the
// example with a TSL composition over the scene pass's current + previous
// texture nodes. Pattern: SCENE-PASS effect (needs the PassNode, not just a
// colour node, to read the retained previous-frame texture).

import { luminance, saturation } from 'three/tsl'
import type { PassNode } from 'three/webgpu'


/** Options for {@link createDifference}. */
export interface DifferenceOptions {
  // Multiplier on the per-pixel difference luminance before clamping.
  gain?:          number
  // Maximum extra saturation applied.
  maxSaturation?: number
}

// Pass the scene PassNode (from createScenePass(...).pass). Returns the
// motion-highlighted colour node to use as output.
/** Increase saturation where the current frame differs from the previous one, highlighting motion. Reads the PassNode's retained previous-frame texture. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createDifference (scenePass: PassNode, options: DifferenceOptions = {}) {
  const { gain = 1000, maxSaturation = 3 } = options
  const current                            = scenePass.getTextureNode()
  const previous                           = scenePass.getPreviousTextureNode()
  const frameDiff                          = previous.sub(current).abs()
  const saturationAmount                   = luminance(frameDiff).mul(gain)
    .clamp(0, maxSaturation)
  return saturation(current, saturationAmount)
}

// perf: low. One extra retained texture and a luminance/saturation pair.
