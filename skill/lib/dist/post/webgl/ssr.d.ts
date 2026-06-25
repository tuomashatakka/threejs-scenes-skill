import * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface SsrOptions {
    selects?: THREE.Mesh[] | null;
    groundReflector?: THREE.Mesh | null;
    thickness?: number;
    opacity?: number;
    maxDistance?: number;
}
export declare function createSsr(ctx: WebGlPassContext, options?: SsrOptions): Pass;
//# sourceMappingURL=ssr.d.ts.map