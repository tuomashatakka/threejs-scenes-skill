// lib/post/webgl/ssaa.ts
// Supersample anti-aliasing — accumulates jittered renders for clean edges.
// Wraps three's official SSAARenderPass. Mirrors the WebGPU `ssaa` effect.

import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'
import type { WebGlPassContext } from './types.js'


export interface SsaaOptions {
  // 0..5; total samples = 2^sampleLevel.
  sampleLevel?: number
  clearColor?:  number
  clearAlpha?:  number
}

export function createSsaa (ctx: WebGlPassContext, options: SsaaOptions = {}): Pass {
  const { sampleLevel = 2, clearColor = 0x000000, clearAlpha = 0 } = options
  const pass                                                       = new SSAARenderPass(ctx.scene, ctx.camera, clearColor, clearAlpha)
  pass.sampleLevel                                                 = sampleLevel
  return pass
}

// perf: expensive. Renders the scene 2^sampleLevel times per frame.
