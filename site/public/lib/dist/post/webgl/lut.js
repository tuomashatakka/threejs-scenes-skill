// lib/post/webgl/lut.ts
// 3D LUT colour grading — remaps colours through a loaded .cube/.3dl/.png LUT.
// Wraps three's official LUTPass. Mirrors the WebGPU `lib/post/webgpu/lut.ts`
// effect. Load the `lut` texture yourself via LUTCubeLoader (.cube) or
// LUTImageLoader (.png) from `three/addons/loaders/` and pass the resulting
// Data3DTexture/DataTexture in.
import { LUTPass } from 'three/addons/postprocessing/LUTPass.js';
export function createLUT(options = {}) {
    const { lut, intensity = 1 } = options;
    // LUTPass takes the LUT texture (set it later via `pass.lut` if loaded async).
    return new LUTPass({ lut, intensity });
}
// perf: low. Single fullscreen pass, one 3D texture lookup per fragment.
//# sourceMappingURL=lut.js.map