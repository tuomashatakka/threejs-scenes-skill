// lib/post/webgpu/fxaa.ts
// FXAA — cheap fast-approximate anti-aliasing on the final image. Wraps three's
// FXAANode. Pattern: COLOUR-INPUT effect. Apply last, on display-space colour
// (the example feeds it `renderOutput(scenePass)`).

import { fxaa } from 'three/addons/tsl/display/FXAANode.js'
import type { ColorNode } from './types.js'




/**
 * Apply fast-approximate anti-aliasing (FXAA) to the final image.
 *
 * @param input - Colour node to anti-alias (typically display-space renderOutput).
 * @returns An FXAANode producing the anti-aliased output.
 * @remarks Requires the WebGPU renderer (three/webgpu). Apply last, on display-space colour. Low cost — single edge-detect pass with no extra render targets.
 */
export function createFxaa (input: ColorNode) {
  return fxaa(input)
}

// perf: low. Single edge-detect pass; no extra render targets.
