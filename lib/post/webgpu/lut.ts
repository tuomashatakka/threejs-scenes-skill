// lib/post/webgpu/lut.ts
// 3D LUT colour grading — remaps colours through a loaded .cube/.3dl/.png LUT.
// Wraps three's Lut3DNode. Pattern: COLOUR-INPUT effect, but operates on the
// already-tone-mapped output (the example wraps the scene pass in renderOutput
// before grading, then disables the pipeline's own output colour transform).

import { texture3D, uniform } from 'three/tsl'
import type { Data3DTexture } from 'three'
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js'
import type { ColorNode } from './types.js'


/** Options for {@link createLut}. */
export interface LutOptions {
  // The loaded 3D LUT texture (e.g. from LUTCubeLoader().load(...).texture3D).
  lut:        Data3DTexture
  // 0..1 blend between original and graded colour.
  intensity?: number
}

// The input should usually be `renderOutput(scenePass)` so grading happens in
// display space; remember to set `postProcessing.outputColorTransform = false`.
/** Wrap a Lut3DNode that remaps colours through a loaded 3D LUT (.cube/.3dl/.png). Apply on tone-mapped display-space colour. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createLut (input: ColorNode, options: LutOptions) {
  const { lut, intensity = 1 } = options
  return lut3D(input, texture3D(lut), lut.image.width, uniform(intensity))
}

// perf: low. Single trilinear sample into the 3D texture per pixel.
