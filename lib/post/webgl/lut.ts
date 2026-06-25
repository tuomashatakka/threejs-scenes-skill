// lib/post/webgl/lut.ts
// 3D LUT colour grading — remaps colours through a loaded .cube/.3dl/.png LUT.
// Wraps three's official LUTPass. Mirrors the WebGPU `lib/post/webgpu/lut.ts`
// effect. Load the `lut` texture yourself via LUTCubeLoader (.cube) or
// LUTImageLoader (.png) from `three/addons/loaders/` and pass the resulting
// Data3DTexture/DataTexture in.

import type * as THREE from 'three'
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


export interface LUTOptions {
  lut?:       THREE.Data3DTexture | THREE.DataTexture
  intensity?: number
}

export function createLUT (options: LUTOptions = {}): Pass {
  const { lut, intensity = 1 } = options
  // LUTPass takes the LUT texture (set it later via `pass.lut` if loaded async).
  return new LUTPass({ lut, intensity }) as unknown as Pass
}

// perf: low. Single fullscreen pass, one 3D texture lookup per fragment.
