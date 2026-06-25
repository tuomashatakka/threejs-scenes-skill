// lib/post/webgl/dof.ts
// Depth of field — bokeh blur by distance from the focus plane. Wraps three's
// official BokehPass. Mirrors the WebGPU `dof` effect (DepthOfFieldNode).

import { BokehPass } from 'three/addons/postprocessing/BokehPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'
import type { WebGlPassContext } from './types.js'


export interface DofOptions {
  focus?:    number
  aperture?: number
  maxblur?:  number
}

export function createDof (ctx: WebGlPassContext, options: DofOptions = {}): Pass {
  const { focus = 10, aperture = 0.00002, maxblur = 0.01 } = options
  return new BokehPass(ctx.scene, ctx.camera, { focus, aperture, maxblur })
}

// perf: medium-high. Sampling cost scales with maxblur.
