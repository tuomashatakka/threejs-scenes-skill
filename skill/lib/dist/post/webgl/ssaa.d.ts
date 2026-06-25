import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface SsaaOptions {
    sampleLevel?: number;
    clearColor?: number;
    clearAlpha?: number;
}
export declare function createSsaa(ctx: WebGlPassContext, options?: SsaaOptions): Pass;
//# sourceMappingURL=ssaa.d.ts.map