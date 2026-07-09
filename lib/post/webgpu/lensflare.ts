// lib/post/webgpu/lensflare.ts
// Screen-space lens flare — ghost reflections + halo from bright spots. Wraps
// three's LensflareNode. Pattern: COLOUR-INPUT effect, typically fed the bloom
// of an emissive MRT channel (example: webgpu_postprocessing_lensflare). Add the
// flare contribution onto the scene colour.

import { uniform } from 'three/tsl'
import type { Node } from 'three/webgpu'
import { lensflare } from 'three/addons/tsl/display/LensflareNode.js'




/** Options for {@link createLensflare}: ghost tint, luminance threshold, ghost samples/spacing/attenuation, and downsample ratio. */
export interface LensflareOptions {
  ghostTint?:              Node
  threshold?:              number
  ghostSamples?:           number
  ghostSpacing?:           number
  ghostAttenuationFactor?: number
  downSampleRatio?:        number
}



/**
 * Render ghost reflections and halo from bright spots in the input.
 *
 * @param input - Colour node (typically the bloom of an emissive MRT channel).
 * @param options.ghostTint - Tint colour for ghost reflections as a TSL Node.
 * @param options.threshold - Luminance threshold for flare generation.
 * @param options.ghostSamples - Number of ghost samples along the flare axis.
 * @param options.ghostSpacing - Spacing between successive ghost samples.
 * @param options.ghostAttenuationFactor - Attenuation factor for each successive ghost.
 * @param options.downSampleRatio - Fraction of full resolution for the flare accumulation buffer.
 * @returns A LensflareNode whose output should be added onto the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — downsampled ghost accumulation; raise downSampleRatio if performance is a concern.
 */
export function createLensflare (input: Node, options: LensflareOptions = {}) {
  const params: Parameters<typeof lensflare>[1] = {}
  if (options.ghostTint !== undefined)
    params.ghostTint = options.ghostTint
  if (options.threshold !== undefined)
    params.threshold = uniform(options.threshold)
  if (options.ghostSamples !== undefined)
    params.ghostSamples = uniform(options.ghostSamples)
  if (options.ghostSpacing !== undefined)
    params.ghostSpacing = uniform(options.ghostSpacing)
  if (options.ghostAttenuationFactor !== undefined)
    params.ghostAttenuationFactor = uniform(options.ghostAttenuationFactor)
  if (options.downSampleRatio !== undefined)
    params.downSampleRatio = options.downSampleRatio
  return lensflare(input, params)
}

// perf: medium. Downsampled ghost accumulation; raise downSampleRatio if costly.
