// lib/post/webgpu/bloom.ts
// Bloom — spreads light from bright pixels for a glow. Wraps three's BloomNode.
// Pattern: COLOUR-INPUT effect. Add the result onto the scene colour.

import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ColorNode } from './types.js'




/** Options for {@link createBloom}: bloom strength, radius, and luminance threshold. */
export interface BloomOptions {
  strength?:  number
  radius?:    number
  threshold?: number
}

// Returns the bloom contribution node. Compose with `input.add(createBloom(...))`
// or assign directly if you want bloom-only output.


/**
 * Spread light from bright pixels for a bloom glow effect.
 *
 * @param input - Colour node to bloom (e.g. scene-pass output).
 * @param options.strength - Bloom intensity. Default `1`.
 * @param options.radius - Bloom spread radius. Default `0`.
 * @param options.threshold - Luminance threshold; only pixels above this value bloom. Default `0`.
 * @returns A BloomNode producing the bloom contribution. Compose with `input.add(createBloom(...))`.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — multi-pass downsample/upsample blur at reduced resolution.
 */
export function createBloom (input: ColorNode, options: BloomOptions = {}) {
  const { strength = 1, radius = 0, threshold = 0 } = options
  return bloom(input, strength, radius, threshold)
}

// perf: medium. Multi-pass downsample/upsample blur at reduced resolution.
