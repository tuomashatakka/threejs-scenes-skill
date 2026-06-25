// lib/post/webgl/afterimage.ts
// Afterimage — trailing motion ghosting that fades over time (echo/persistence
// of vision). Wraps three's official AfterimagePass. Mirrors the WebGPU
// `lib/post/webgpu/afterimage.ts` effect.

import { AfterimagePass } from 'three/addons/postprocessing/AfterimagePass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


export interface AfterimageOptions {
  damp?: number
}

export function createAfterimage (options: AfterimageOptions = {}): Pass {
  const { damp = 0.96 } = options
  return new AfterimagePass(damp)
}

// perf: low. One feedback blend against the previous frame each pass.
