import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface LensingOptions {
    /** Influence radius in UV units. */
    radius?: number;
    strength?: number;
    /** Dark-core (event horizon) radius in UV units; 0 disables. */
    coreSize?: number;
}
export interface LensingPass extends ShaderPass {
    /** Point the lens at a screen UV (see core/projection.ts). */
    setCenter(u: number, v: number): void;
    setSize(width: number, height: number): void;
}
export declare function createLensingPass({ radius, strength, coreSize }?: LensingOptions): LensingPass;
//# sourceMappingURL=lensing.d.ts.map