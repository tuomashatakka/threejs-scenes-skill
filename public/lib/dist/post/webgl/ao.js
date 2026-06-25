// lib/post/webgl/ao.ts
// Ground-truth ambient occlusion — darkens crevices and contact shadows. Wraps
// three's official GTAOPass. Mirrors the WebGPU `ao` (GTAO) effect.
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
export function createAo(ctx, options = {}) {
    const pass = new GTAOPass(ctx.scene, ctx.camera, ctx.width, ctx.height);
    if (options.output !== undefined)
        pass.output = options.output;
    pass.setSize(ctx.width, ctx.height);
    return pass;
}
// perf: expensive. Multi-sample horizon search + denoise; budget carefully.
//# sourceMappingURL=ao.js.map