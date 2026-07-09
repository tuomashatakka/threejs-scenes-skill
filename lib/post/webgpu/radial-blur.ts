// lib/post/webgpu/radial-blur.ts
// Radial (zoom) blur — streaks the image outward from a centre point, the
// classic speed / hyperspace look. Wraps three's radialBlur. Pattern:
// COLOUR-INPUT effect; use the result directly as output.

import { float, int, uniform } from 'three/tsl'
import { radialBlur } from 'three/addons/tsl/display/radialBlur.js'
import type { ColorNode } from './types.js'




/** Options for {@link createRadialBlur}: sample weight, decay, exposure, and sample count. */
export interface RadialBlurOptions {
  // Per-sample weight contribution.
  weight?:   number
  // Per-sample decay falloff.
  decay?:    number
  // Exposure multiplier on the accumulated samples.
  exposure?: number
  // Number of samples along the radial direction.
  count?:    number
}



/**
 * Streak the image outward from centre for a speed / hyperspace zoom-blur effect.
 *
 * @param input - Colour node to blur.
 * @param options.weight - Per-sample weight contribution. Default `0.9`.
 * @param options.decay - Per-sample decay falloff. Default `0.95`.
 * @param options.exposure - Exposure multiplier on the accumulated samples. Default `5`.
 * @param options.count - Number of samples along the radial direction. Default `32`.
 * @returns A radialBlur node producing the zoom-streaked output.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — scales linearly with `count`.
 */
export function createRadialBlur (input: ColorNode, options: RadialBlurOptions = {}) {
  const { weight = 0.9, decay = 0.95, exposure = 5, count = 32 } = options
  return radialBlur(input, {
    weight:   uniform(float(weight)),
    decay:    uniform(float(decay)),
    exposure: uniform(int(exposure)),
    count:    uniform(int(count)),
  })
}

// perf: medium. Cost scales linearly with `count` samples.
