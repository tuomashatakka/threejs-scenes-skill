import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface MotionBlurOptions {
    intensity?: number;
    samples?: number;
    depthTexture?: THREE.Texture | null;
}
export interface MotionBlurPass extends ShaderPass {
    update(camera: THREE.Camera): void;
    setDepthTexture(texture: THREE.Texture | null): void;
}
export declare function createMotionBlur(options?: MotionBlurOptions): MotionBlurPass;
//# sourceMappingURL=motion-blur.d.ts.map