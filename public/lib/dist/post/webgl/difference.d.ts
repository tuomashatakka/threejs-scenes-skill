import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface DifferenceOptions {
    compare?: THREE.Texture | null;
    scale?: number;
}
export interface DifferencePass extends ShaderPass {
    setCompareTexture(texture: THREE.Texture | null): void;
}
export declare function createDifference(options?: DifferenceOptions): DifferencePass;
//# sourceMappingURL=difference.d.ts.map