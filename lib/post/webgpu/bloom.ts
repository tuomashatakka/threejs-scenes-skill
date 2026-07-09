// lib/post/webgpu/bloom.ts
// Bloom — spreads light from bright pixels for a glow. Wraps three's BloomNode.
// Pattern: COLOUR-INPUT effect. Add the result onto the scene colour.

import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { ColorNode } from './types.js'


/** Options for {@link createBloom}. */
export interface BloomOptions {
  strength?:  number
  radius?:    number
  threshold?: number
}

// Returns the bloom contribution node. Compose with `input.add(createBloom(...))`
// or assign directly if you want bloom-only output.
/** Wrap a BloomNode that spreads light from bright pixels for a glow effect. Returns the bloom contribution — compose with input.add(createBloom(...)). @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createBloom (input: ColorNode, options: BloomOptions = {}) {
  const { strength = 1, radius = 0, threshold = 0 } = options
  return bloom(input, strength, radius, threshold)
}

// perf: medium. Multi-pass downsample/upsample blur at reduced resolution.
