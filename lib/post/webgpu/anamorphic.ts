// lib/post/webgpu/anamorphic.ts
// Anamorphic lens flare — horizontal streaks from bright highlights, the classic
// sci-fi blue bar. Wraps three's AnamorphicNode. Pattern: COLOUR-INPUT effect;
// add the streak contribution back onto the scene colour (optionally * intensity).

import { uniform } from 'three/tsl'
import { anamorphic } from 'three/addons/tsl/display/AnamorphicNode.js'
import type { ColorNode } from './types.js'


/** Options for {@link createAnamorphic}. */
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

/** Wrap an AnamorphicNode that produces horizontal streak lens flares from bright highlights. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createAnamorphic (input: ColorNode, options: AnamorphicOptions = {}) {
  const { threshold = 1.4, scale = 5, samples = 32, resolutionScale = 1 } = options
  const node                                                              = anamorphic(input, uniform(threshold), uniform(scale), samples)
  node.resolutionScale                                                    = resolutionScale
  return node
}

// perf: medium. Cost scales with samples; drop resolutionScale to recover it.
