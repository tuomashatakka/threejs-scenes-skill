// lib/post/webgpu/lut.ts
// 3D LUT colour grading — remaps colours through a loaded .cube/.3dl/.png LUT.
// Wraps three's Lut3DNode. Pattern: COLOUR-INPUT effect, but operates on the
// already-tone-mapped output (the example wraps the scene pass in renderOutput
// before grading, then disables the pipeline's own output colour transform).

import { texture3D, uniform } from 'three/tsl'
import type { Data3DTexture } from 'three'
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js'
import type { ColorNode } from './types.js'




/** Options for {@link createLut}: the loaded 3D LUT texture and blend intensity. */
export interface LutOptions {
  // The loaded 3D LUT texture (e.g. from LUTCubeLoader().load(...).texture3D).
  lut:        Data3DTexture
  // 0..1 blend between original and graded colour.
  intensity?: number
}

// The input should usually be `renderOutput(scenePass)` so grading happens in
// display space; remember to set `postProcessing.outputColorTransform = false`.


/**
 * Remap colours through a loaded 3D LUT (.cube / .3dl / .png) for colour grading.
 *
 * @param input - Colour node to grade, typically `renderOutput(scenePass)` so grading happens in display space.
 * @param options.lut - The loaded 3D LUT as a {@link Data3DTexture} (e.g. from LUTCubeLoader().load(...).texture3D).
 * @param options.intensity - Blend between original and graded colour, 0..1. Default `1`.
 * @returns A Lut3DNode producing the graded colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Remember to set `postProcessing.outputColorTransform = false` when grading in display space. Low cost — single trilinear sample into the 3D texture per pixel.
 */
export function createLut (input: ColorNode, options: LutOptions) {
  const { lut, intensity = 1 } = options
  return lut3D(input, texture3D(lut), lut.image.width, uniform(intensity))
}

// perf: low. Single trilinear sample into the 3D texture per pixel.
