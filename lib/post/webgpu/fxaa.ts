// lib/post/webgpu/fxaa.ts
// FXAA — cheap fast-approximate anti-aliasing on the final image. Wraps three's
// FXAANode. Pattern: COLOUR-INPUT effect. Apply last, on display-space colour
// (the example feeds it `renderOutput(scenePass)`).

import { fxaa } from 'three/addons/tsl/display/FXAANode.js'
import type { ColorNode } from './types.js'


/** Wrap an FXAANode that applies fast-approximate anti-aliasing on the final image. Apply last, on display-space colour. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createFxaa (input: ColorNode) {
  return fxaa(input)
}

// perf: low. Single edge-detect pass; no extra render targets.
