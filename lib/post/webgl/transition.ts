// lib/post/webgl/transition.ts
// Scene transition — blends between two scene/camera pairs, optionally masked by
// a texture. Wraps three's official RenderTransitionPass. Mirrors the WebGPU
// `transition` effect. Needs a SECOND scene/camera, so it skips WebGlPassContext.

import * as THREE from 'three'
import { RenderTransitionPass } from 'three/addons/postprocessing/RenderTransitionPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


export interface TransitionOptions {
  // 0 = fully scene A, 1 = fully scene B.
  transition?:       number
  // Optional mask texture driving the wipe; enables texture mode when set.
  texture?:          THREE.Texture
  // Softness of the texture-driven wipe edge.
  textureThreshold?: number
}

export function createTransition (
  sceneA:  THREE.Scene,
  cameraA: THREE.Camera,
  sceneB:  THREE.Scene,
  cameraB: THREE.Camera,
  options: TransitionOptions = {},
): Pass {
  const { transition = 0.5, texture, textureThreshold = 0.1 } = options
  const pass                                                  = new RenderTransitionPass(sceneA, cameraA, sceneB, cameraB)
  pass.setTransition(transition)
  if (texture) {
    pass.setTexture(texture)
    pass.setTextureThreshold(textureThreshold)
    pass.useTexture(true)
  }
  return pass
}

// perf: medium. Renders both scenes each frame, then blends.
