// lib/post/webgl/ssaa.ts
// Supersample anti-aliasing — accumulates jittered renders for clean edges.
// Wraps three's official SSAARenderPass. Mirrors the WebGPU `ssaa` effect.
import { SSAARenderPass } from 'three/addons/postprocessing/SSAARenderPass.js';
export function createSsaa(ctx, options = {}) {
    const { sampleLevel = 2, clearColor = 0x000000, clearAlpha = 0 } = options;
    const pass = new SSAARenderPass(ctx.scene, ctx.camera, clearColor, clearAlpha);
    pass.sampleLevel = sampleLevel;
    return pass;
}
// perf: expensive. Renders the scene 2^sampleLevel times per frame.
//# sourceMappingURL=ssaa.js.map