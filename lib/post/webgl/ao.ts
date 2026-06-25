// lib/post/webgl/ao.ts
// Ground-truth ambient occlusion — darkens crevices and contact shadows. Wraps
// three's official GTAOPass. Mirrors the WebGPU `ao` (GTAO) effect.

import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'
import type { WebGlPassContext } from './types.js'


export interface AoOptions {
  // GTAOPass.OUTPUT enum value — Default / Diffuse / AO / Denoise / Depth / ...
  output?: number
}

export function createAo (ctx: WebGlPassContext, options: AoOptions = {}): Pass {
  const pass = new GTAOPass(ctx.scene, ctx.camera, ctx.width, ctx.height)
  if (options.output !== undefined)
    pass.output = options.output
  pass.setSize(ctx.width, ctx.height)
  return pass
}

// perf: expensive. Multi-sample horizon search + denoise; budget carefully.
