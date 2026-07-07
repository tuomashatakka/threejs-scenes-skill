import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface DofOptions {
    focus?: number;
    aperture?: number;
    maxblur?: number;
}
export declare function createDof(ctx: WebGlPassContext, options?: DofOptions): Pass;
//# sourceMappingURL=dof.d.ts.map