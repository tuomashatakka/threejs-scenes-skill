// lib/post/webgpu/bloom-selective.ts
// Selective bloom — only objects tagged via an MRT `bloomIntensity` channel
// bloom. There is no single node for this; it is an MRT composition around
// BloomNode (example: webgpu_postprocessing_bloom_selective). Pattern:
// SCENE-PASS + MRT. Set each mesh's `material.mrtNode = mrt({ bloomIntensity })`
// and give the scene pass an `output` + `bloomIntensity` MRT layout.

import { bloom } from 'three/addons/tsl/display/BloomNode.js'
import type { PassNode } from 'three/webgpu'


/** Options for {@link createBloomSelective}. */
export interface BloomSelectiveOptions {
  strength?:  number
  radius?:    number
  threshold?: number
}

// `scenePass` must have been set up with an MRT exposing a `bloomIntensity`
// channel (see the readme wiring note). Returns { output, bloom, result } so the
// caller can inspect the masked bloom or use `result` directly as the output.
/** Bloom only objects tagged via an MRT bloomIntensity channel. Set material.mrtNode = mrt({ bloomIntensity }) per mesh. Returns { output, bloom, result }. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createBloomSelective (scenePass: PassNode, options: BloomSelectiveOptions = {}) {
  const { strength = 1, radius = 0, threshold = 0 } = options
  const output                                      = scenePass.getTextureNode('output')
  const bloomIntensity                              = scenePass.getTextureNode('bloomIntensity')
  const bloomPass                                   = bloom(output.mul(bloomIntensity), strength, radius, threshold)
  return { output, bloom: bloomPass, result: output.add(bloomPass) }
}

// perf: medium. One extra (low-precision) MRT attachment plus the bloom blur.
