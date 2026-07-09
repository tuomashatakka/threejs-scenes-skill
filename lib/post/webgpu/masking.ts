// lib/post/webgpu/masking.ts
// Stencil-style masking — composite textures into the screen regions covered by
// helper "mask" scenes, using each mask pass's alpha. No dedicated node; this
// mirrors the example (webgpu_postprocessing_masking) with a TSL mix chain.
// Pattern: MULTI-PASS composition.

import * as THREE from 'three'
import { mix, pass, texture } from 'three/tsl'
import type { Node } from 'three/webgpu'


/** A scene whose rendered alpha defines a mask region, plus the texture to composite there. */
export interface MaskLayer {
  // A scene whose rendered alpha defines the mask region.
  scene:   THREE.Scene
  // Texture to show where this layer's mask is opaque.
  texture: THREE.Texture
}

// Composites each layer onto `base` in order, using the alpha of pass(scene) as
// the mask. Returns the composed colour node to use as output.
/** Stencil-style masking: composite textures into screen regions covered by helper mask scenes, using each pass's alpha. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createMasking (base: Node<'vec4'>, camera: THREE.Camera, layers: MaskLayer[]): Node {
  let compose: Node<'vec4'> = base
  for (const layer of layers) {
    const maskAlpha = pass(layer.scene, camera).getTextureNode().a
    compose = mix(compose, texture(layer.texture), maskAlpha)
  }
  return compose
}

// perf: medium. One extra render pass per mask layer.
