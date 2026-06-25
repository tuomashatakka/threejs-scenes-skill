import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface AnamorphicOptions {
    threshold?: number;
    scale?: number;
    samples?: number;
    tint?: THREE.Color;
}
export interface AnamorphicPass extends ShaderPass {
    setSize(width: number, height: number): void;
}
export declare function createAnamorphic(options?: AnamorphicOptions): AnamorphicPass;
//# sourceMappingURL=anamorphic.d.ts.map