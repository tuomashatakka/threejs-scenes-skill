// lib/post/webgl/dof.ts
// Depth of field — bokeh blur by distance from the focus plane. Wraps three's
// official BokehPass. Mirrors the WebGPU `dof` effect (DepthOfFieldNode).
import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
export function createDof(ctx, options = {}) {
    const { focus = 10, aperture = 0.00002, maxblur = 0.01 } = options;
    return new BokehPass(ctx.scene, ctx.camera, { focus, aperture, maxblur });
}
// perf: medium-high. Sampling cost scales with maxblur.
//# sourceMappingURL=dof.js.map