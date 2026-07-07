import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import type { FrameContext } from '../../types.js';
export interface CrtOptions {
    /** Pincushion strength; 0 disables the warp. */
    curvature?: number;
    /** Edge darkening, [0,1]. */
    vignette?: number;
    /** Glitch tear probability scale, [0,1]. */
    glitch?: number;
}
export interface CrtPass extends ShaderPass {
    /** Advance the glitch clock — call from your frame loop. */
    tick(ctx: FrameContext): void;
}
export declare function createCrtPass({ curvature, vignette, glitch }?: CrtOptions): CrtPass;
/**
 * Invert the CRT warp for picking: pass pointer NDC coords + the pass's
 * curvature and raycast with the returned NDC instead. Compatible with the
 * `distortion` hook of architecture/pick.ts.
 */
type CrtCorrectPointerReturnType = {
    x: number;
    y: number;
};
export declare function crtCorrectPointer(ndcX: number, ndcY: number, curvature: number): CrtCorrectPointerReturnType;
export type { ShaderPass };
//# sourceMappingURL=crt.d.ts.map