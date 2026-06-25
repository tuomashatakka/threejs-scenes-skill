// lib/post/webgl/sobel.ts
// Sobel edge detection — outlines via the Sobel gradient operator. Wraps three's
// official SobelOperatorShader in a ShaderPass. Mirrors the WebGPU
// `lib/post/webgpu/sobel.ts` effect. The shader reads `tDiffuse` and needs the
// `resolution` uniform set to the render size (update on resize).
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { SobelOperatorShader } from 'three/addons/shaders/SobelOperatorShader.js';
export function createSobel(options = {}) {
    const { width = 1, height = 1 } = options;
    const pass = new ShaderPass(SobelOperatorShader);
    pass.uniforms.resolution.value = new THREE.Vector2(width, height);
    return pass;
}
// perf: low. Single fullscreen pass, 3x3 luma gradient kernel per fragment.
//# sourceMappingURL=sobel.js.map