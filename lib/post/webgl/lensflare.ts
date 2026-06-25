// lib/post/webgl/lensflare.ts
// Lens flare. NOTE: unlike the WebGPU `webgpu/lensflare.ts` (a post node added to
// the output graph), the WebGL addon flare is a SCENE OBJECT you attach to a
// light — `three/addons/objects/Lensflare`. It renders the ghost/halo sprites
// from the light's screen position with occlusion testing. Add the returned
// object to a light: `light.add(createLensflare({ elements }))`.

import * as THREE from 'three'
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js'


export interface LensflareElementSpec {
  texture:   THREE.Texture
  size?:     number // px at distance 0
  distance?: number // 0 (at light) .. 1 (screen edge)
  color?:    THREE.Color
}

export interface LensflareOptions {
  // One entry per ghost/halo sprite. Provide your own loaded textures.
  elements?: LensflareElementSpec[]
}

export function createLensflare (options: LensflareOptions = {}): Lensflare {
  const flare = new Lensflare()
  for (const e of options.elements ?? [])
    flare.addElement(new LensflareElement(
      e.texture,
      e.size ?? 100,
      e.distance ?? 0,
      e.color ?? new THREE.Color(0xffffff),
    ))
  return flare
}

// perf: low-medium. GPU occlusion query per flare; a handful of textured quads.
