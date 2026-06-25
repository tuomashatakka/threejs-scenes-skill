// lib/post/webgl/smaa.ts
// SMAA — subpixel morphological anti-aliasing, higher quality than FXAA with
// sharper edge reconstruction. Wraps three's official SMAAPass. Mirrors the
// WebGPU `lib/post/webgpu/smaa.ts` effect. Call `pass.setSize(w, h)` once the
// canvas dimensions are known.

import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


// Empty options kept for signature parity with the other factories.
export type SMAAOptions = Record<string, never>

export function createSMAA (_options: SMAAOptions = {}): Pass {
  return new SMAAPass()
}

// perf: medium. Edge detection + blend-weight + neighbourhood blend passes.
