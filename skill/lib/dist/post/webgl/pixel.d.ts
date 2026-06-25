import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface PixelOptions {
    pixelSize?: number;
    normalEdgeStrength?: number;
    depthEdgeStrength?: number;
}
export declare function createPixel(ctx: WebGlPassContext, options?: PixelOptions): Pass;
//# sourceMappingURL=pixel.d.ts.map