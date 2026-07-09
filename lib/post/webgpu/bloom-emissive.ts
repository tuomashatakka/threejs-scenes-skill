// lib/post/webgpu/bloom-emissive.ts
// Emissive bloom — blooms only the emissive contribution of PBR materials, so
// glowing parts shine without washing out lit surfaces. MRT composition around
// BloomNode (example: webgpu_postprocessing_bloom_emissive). Pattern:
// SCENE-PASS + MRT exposing an `emissive` channel.

import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { PassNode } from 'three/webgpu'




/** Options for {@link createBloomEmissive}: bloom strength, radius, and luminance threshold. */
export interface BloomEmissiveOptions {
  strength?:  number
  radius?:    number
  threshold?: number
}

// `scenePass` must expose an `emissive` MRT channel (see readme wiring note).
// Returns { output, bloom, result }; use `result` (= output + bloom) as output.


/**
 * Bloom only the emissive PBR contribution from an MRT scene pass, leaving lit surfaces unwashed.
 *
 * @param scenePass - A {@link PassNode} configured with an MRT exposing an `emissive` channel.
 * @param options.strength - Bloom intensity. Default `2.5`.
 * @param options.radius - Bloom spread radius. Default `0.5`.
 * @param options.threshold - Luminance threshold for blooming. Default `0`.
 * @returns An object `{ output, bloom, result }`. Use `result` (= output + bloom) as the output node.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — one extra emissive MRT attachment plus the bloom blur passes.
 */
export function createBloomEmissive (scenePass: PassNode, options: BloomEmissiveOptions = {}) {
  const { strength = 2.5, radius = 0.5, threshold = 0 } = options
  const output                                          = scenePass.getTextureNode('output')
  const emissivePass                                    = scenePass.getTextureNode('emissive')
  const bloomPass                                       = bloom(emissivePass, strength, radius, threshold)
  return { output, bloom: bloomPass, result: output.add(bloomPass) }
}

// perf: medium. One extra emissive MRT attachment plus the bloom blur.
