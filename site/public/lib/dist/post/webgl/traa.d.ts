import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface TraaOptions {
    sampleLevel?: number;
    accumulate?: boolean;
    clearColor?: number;
    clearAlpha?: number;
}
export declare function createTraa(ctx: WebGlPassContext, options?: TraaOptions): Pass;
//# sourceMappingURL=traa.d.ts.map