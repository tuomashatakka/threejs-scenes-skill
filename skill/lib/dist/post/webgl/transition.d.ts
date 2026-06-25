import * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface TransitionOptions {
    transition?: number;
    texture?: THREE.Texture;
    textureThreshold?: number;
}
export declare function createTransition(sceneA: THREE.Scene, cameraA: THREE.Camera, sceneB: THREE.Scene, cameraB: THREE.Camera, options?: TransitionOptions): Pass;
//# sourceMappingURL=transition.d.ts.map