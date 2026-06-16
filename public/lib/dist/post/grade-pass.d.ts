import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export declare const GradeShader: {
    uniforms: {
        tDiffuse: {
            value: null;
        };
        uTime: {
            value: number;
        };
        uTint: {
            value: THREE.Color;
        };
        uContrast: {
            value: number;
        };
        uSaturation: {
            value: number;
        };
        uVignette: {
            value: number;
        };
        uGrain: {
            value: number;
        };
        uChromatic: {
            value: number;
        };
    };
    vertexShader: string;
    fragmentShader: string;
};
export interface GradePassOptions {
    tint?: THREE.ColorRepresentation;
    contrast?: number;
    saturation?: number;
    vignette?: number;
    grain?: number;
    chromatic?: number;
}
export interface GradePass extends ShaderPass {
    setTime(elapsed: number): void;
}
export declare function createGradePass({ tint, contrast, saturation, vignette, grain, chromatic, }?: GradePassOptions): GradePass;
//# sourceMappingURL=grade-pass.d.ts.map