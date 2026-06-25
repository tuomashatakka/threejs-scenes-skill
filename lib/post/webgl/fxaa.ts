// lib/post/webgl/fxaa.ts
// FXAA — fast approximate anti-aliasing, a cheap single-pass edge smoothing
// filter. Wraps three's official FXAAPass (auto-tracks resolution via setSize).
// Mirrors the WebGPU `lib/post/webgpu/fxaa.ts` effect. For higher quality at a
// modest extra cost, prefer SMAA (see `lib/post/webgl/smaa.ts`).

import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


// Empty options kept for signature parity with the other factories.
export type FXAAOptions = Record<string, never>

export function createFXAA (_options: FXAAOptions = {}): Pass {
  return new FXAAPass()
}

// perf: low. Single fullscreen luma-edge blur.
