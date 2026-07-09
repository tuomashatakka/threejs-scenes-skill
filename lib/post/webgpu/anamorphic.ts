// lib/post/webgpu/anamorphic.ts
// Anamorphic lens flare — horizontal streaks from bright highlights, the classic
// sci-fi blue bar. Wraps three's AnamorphicNode. Pattern: COLOUR-INPUT effect;
// add the streak contribution back onto the scene colour (optionally * intensity).

import { uniform } from 'three/tsl'
import { anamorphic } from 'three/addons/tsl/display/AnamorphicNode.js'
import type { ColorNode } from './types.js'




/** Options for {@link createAnamorphic}: luminance threshold, streak stretch, tap count, and resolution scale. */
export interface AnamorphicOptions {
  // Luminance above which pixels streak.
  threshold?:       number
  // Horizontal stretch of the streak.
  scale?:           number
  // Number of taps along the streak; more = smoother, costlier.
  samples?:         number
  // Render the streak buffer at a fraction of full resolution (1 = full).
  resolutionScale?: number
}



/**
 * Create an anamorphic lens-flare node that produces horizontal streaks from bright highlights.
 *
 * @param input - Colour node to process (post-bloom or scene output).
 * @param options.threshold - Luminance threshold above which pixels streak. Default `1.4`.
 * @param options.scale - Horizontal stretch of the streak. Default `5`.
 * @param options.samples - Number of taps along the streak; higher = smoother but costlier. Default `32`.
 * @param options.resolutionScale - Fraction of full resolution for the streak buffer. Default `1`.
 * @returns An AnamorphicNode whose output should be added onto the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — scales linearly with `samples`; reduce `resolutionScale` to recover performance.
 */
export function createAnamorphic (input: ColorNode, options: AnamorphicOptions = {}) {
  const { threshold = 1.4, scale = 5, samples = 32, resolutionScale = 1 } = options
  const node                                                              = anamorphic(input, uniform(threshold), uniform(scale), samples)
  node.resolutionScale                                                    = resolutionScale
  return node
}

// perf: medium. Cost scales with samples; drop resolutionScale to recover it.
