// lib/post/webgpu/ssaa.ts
// SSAA — supersampling anti-aliasing: renders the scene multiple times with
// jittered subpixel offsets and averages them for reference-quality edges.
// Wraps three's ssaaPass, a PassNode rendering the scene, so use it INSTEAD of a
// plain scene pass. Pattern: SCENE PASS replacement.
import { ssaaPass } from 'three/addons/tsl/display/SSAAPassNode.js';
export function createSsaaPass(scene, camera, options = {}) {
    const node = ssaaPass(scene, camera);
    if (options.sampleLevel !== undefined)
        node.sampleLevel = options.sampleLevel;
    if (options.unbiased !== undefined)
        node.unbiased = options.unbiased;
    return node;
}
// perf: very high. Renders the whole scene 2^sampleLevel times; use for stills
// or high-end hardware, not real-time on mobile.
//# sourceMappingURL=ssaa.js.map