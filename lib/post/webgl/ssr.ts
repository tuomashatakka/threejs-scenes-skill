// lib/post/webgl/ssr.ts
// Screen-space reflections — mirror-like reflections from the depth/colour
// buffers. Wraps three's official SSRPass. Mirrors the WebGPU `ssr` effect.

import * as THREE from 'three'
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'
import type { WebGlPassContext } from './types.js'


export interface SsrOptions {
  // Meshes that receive reflections; null reflects everything.
  selects?:         THREE.Mesh[] | null
  // Optional ReflectorForSSRPass ground plane.
  groundReflector?: THREE.Mesh | null
  thickness?:       number
  opacity?:         number
  maxDistance?:     number
}

export function createSsr (ctx: WebGlPassContext, options: SsrOptions = {}): Pass {
  const { selects = null, groundReflector = null, thickness, opacity, maxDistance } = options
  const pass                                                                        = new SSRPass({
    renderer: ctx.renderer,
    scene:    ctx.scene,
    camera:   ctx.camera,
    width:    ctx.width,
    height:   ctx.height,
    selects,
    groundReflector,
  } as ConstructorParameters<typeof SSRPass>[0])
  if (thickness !== undefined)
    pass.thickness = thickness
  if (opacity !== undefined)
    pass.opacity = opacity
  if (maxDistance !== undefined)
    pass.maxDistance = maxDistance
  return pass
}

// perf: expensive. Ray-marches the depth buffer per pixel; reduce maxDistance.
