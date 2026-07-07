// lib/post/webgpu/smaa.ts
// SMAA — subpixel morphological anti-aliasing, higher quality edges than FXAA.
// Wraps three's SMAANode. Pattern: COLOUR-INPUT effect; apply on the scene
// colour as the output node.
import { smaa } from 'three/addons/tsl/display/SMAANode.js';
export function createSmaa(input) {
    return smaa(input);
}
// perf: low-medium. Edge + blend-weight passes using two precomputed lookups.
//# sourceMappingURL=smaa.js.map