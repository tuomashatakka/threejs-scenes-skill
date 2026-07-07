import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface GodRaysPass extends ShaderPass {
    updateFromLight(lightWorldPos: THREE.Vector3, camera: THREE.Camera): void;
    setOcclusionTexture(texture: THREE.Texture | null): void;
}
export declare function createGodRaysPass(): GodRaysPass;
//# sourceMappingURL=god-rays-pass.d.ts.map