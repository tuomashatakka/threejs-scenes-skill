// lib/post/webgl/ssr.ts
// Screen-space reflections — mirror-like reflections from the depth/colour
// buffers. Wraps three's official SSRPass. Mirrors the WebGPU `ssr` effect.
import { SSRPass } from 'three/addons/postprocessing/SSRPass.js';
export function createSsr(ctx, options = {}) {
    const { selects = null, groundReflector = null, thickness, opacity, maxDistance } = options;
    const pass = new SSRPass({
        renderer: ctx.renderer,
        scene: ctx.scene,
        camera: ctx.camera,
        width: ctx.width,
        height: ctx.height,
        selects,
        groundReflector,
    });
    if (thickness !== undefined)
        pass.thickness = thickness;
    if (opacity !== undefined)
        pass.opacity = opacity;
    if (maxDistance !== undefined)
        pass.maxDistance = maxDistance;
    return pass;
}
// perf: expensive. Ray-marches the depth buffer per pixel; reduce maxDistance.
//# sourceMappingURL=ssr.js.map