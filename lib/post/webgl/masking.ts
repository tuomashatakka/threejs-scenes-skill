// lib/post/webgl/masking.ts
// Stencil masking — restrict subsequent passes to a sub-region defined by a mask
// scene. WebGL equivalent of the WebGPU `webgpu/masking.ts` (layer/mask compose).
// Uses three's MaskPass + ClearMaskPass. Usage in an EffectComposer:
//   composer.addPass(new RenderPass(scene, camera))
//   composer.addPass(mask)          // writes the stencil from maskScene
//   composer.addPass(effectInsideMask)
//   composer.addPass(clear)         // releases the stencil
// Everything between mask and clear is confined to where maskScene drew.

import { MaskPass, ClearMaskPass } from 'three/addons/postprocessing/MaskPass.js'
import type * as THREE from 'three'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


export interface MaskLayer {
  mask:  Pass
  clear: Pass
}

export function createMaskPasses (
  maskScene: THREE.Scene,
  maskCamera: THREE.Camera,
  options: { inverse?: boolean } = {},
): MaskLayer {
  const mask   = new MaskPass(maskScene, maskCamera)
  mask.inverse = options.inverse ?? false
  return { mask, clear: new ClearMaskPass() }
}

// perf: low. The mask render is an extra (usually cheap) scene pass.
