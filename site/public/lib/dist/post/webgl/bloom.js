// lib/post/webgl/bloom.ts
// Bloom — spreads light from bright pixels for a soft glow. Wraps three's
// official UnrealBloomPass (multi-scale gaussian downsample/upsample).
// Mirrors the WebGPU `lib/post/webgpu/bloom.ts` effect.
import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
export function createBloom(options = {}) {
    const { strength = 0.7, radius = 0.4, threshold = 0.85, width = 1, height = 1 } = options;
    const resolution = new THREE.Vector2(width, height);
    const pass = new UnrealBloomPass(resolution, strength, radius, threshold);
    // resize later with `pass.setSize(w, h)` once the canvas dimensions are known.
    return pass;
}
// perf: medium. Multi-pass downsample/upsample blur at reduced resolution.
//# sourceMappingURL=bloom.js.map