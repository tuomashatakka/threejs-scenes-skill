import type * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface LUTOptions {
    lut?: THREE.Data3DTexture | THREE.DataTexture;
    intensity?: number;
}
export declare function createLUT(options?: LUTOptions): Pass;
//# sourceMappingURL=lut.d.ts.map