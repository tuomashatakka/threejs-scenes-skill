import * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface RadialBlurOptions {
    center?: THREE.Vector2;
    weight?: number;
    decay?: number;
    count?: number;
    exposure?: number;
}
export declare function createRadialBlur(options?: RadialBlurOptions): Pass;
//# sourceMappingURL=radial-blur.d.ts.map