// lib/post/webgpu/lut.ts
// 3D LUT colour grading — remaps colours through a loaded .cube/.3dl/.png LUT.
// Wraps three's Lut3DNode. Pattern: COLOUR-INPUT effect, but operates on the
// already-tone-mapped output (the example wraps the scene pass in renderOutput
// before grading, then disables the pipeline's own output colour transform).
import { texture3D, uniform } from 'three/tsl';
import { lut3D } from 'three/addons/tsl/display/Lut3DNode.js';
// The input should usually be `renderOutput(scenePass)` so grading happens in
// display space; remember to set `postProcessing.outputColorTransform = false`.
export function createLut(input, options) {
    const { lut, intensity = 1 } = options;
    return lut3D(input, texture3D(lut), lut.image.width, uniform(intensity));
}
// perf: low. Single trilinear sample into the 3D texture per pixel.
//# sourceMappingURL=lut.js.map