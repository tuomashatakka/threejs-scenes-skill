// lib/post/webgl/pixel.ts
// Pixelation — renders the scene at a chunky pixel grid with edge accents.
// Wraps three's official RenderPixelatedPass. Mirrors the WebGPU `pixel` effect.
import { RenderPixelatedPass } from 'three/addons/postprocessing/RenderPixelatedPass.js';
export function createPixel(ctx, options = {}) {
    const { pixelSize = 6, normalEdgeStrength = 0.3, depthEdgeStrength = 0.4 } = options;
    return new RenderPixelatedPass(pixelSize, ctx.scene, ctx.camera, { normalEdgeStrength, depthEdgeStrength });
}
// perf: cheap-medium. Re-renders the scene once at reduced resolution.
//# sourceMappingURL=pixel.js.map