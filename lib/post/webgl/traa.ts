// lib/post/webgl/traa.ts
// Temporal anti-aliasing — accumulates jittered frames over time. Wraps three's
// official TAARenderPass; the WebGL temporal-AA analogue of the WebGPU `traa`
// (TRAA) effect.

import { TAARenderPass } from 'three/addons/postprocessing/TAARenderPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'
import type { WebGlPassContext } from './types.js'


export interface TraaOptions {
  // 0..5; samples blended once accumulate converges = 2^sampleLevel.
  sampleLevel?: number
  // Keep accumulating across static frames (true) vs single-frame TAA (false).
  accumulate?:  boolean
  clearColor?:  number
  clearAlpha?:  number
}

export function createTraa (ctx: WebGlPassContext, options: TraaOptions = {}): Pass {
  const { sampleLevel = 2, accumulate = false, clearColor = 0x000000, clearAlpha = 0 } = options
  const pass                                                                           = new TAARenderPass(ctx.scene, ctx.camera, clearColor, clearAlpha)
  pass.sampleLevel                                                                     = sampleLevel
  pass.accumulate                                                                      = accumulate
  return pass
}

// perf: medium. One extra render per accumulation step; converges then idles.
