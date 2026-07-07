import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface DofPassOptions {
    focalDistance?: number;
    focalRange?: number;
    maxBlur?: number;
    caStrength?: number;
    near?: number;
    far?: number;
}
export interface DofPass extends ShaderPass {
    focusOn(worldPos: THREE.Vector3, camera: THREE.Camera): void;
    setAspect(aspect: number): void;
}
export declare function createDofPass({ focalDistance, focalRange, maxBlur, caStrength, near, far, }?: DofPassOptions): DofPass;
//# sourceMappingURL=dof-chromatic-pass.d.ts.map