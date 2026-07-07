import type * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export type { Pass };
export interface WebGlPassContext {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    width: number;
    height: number;
}
export type WebGlEffect = Pass;
export interface Resizable {
    setSize(width: number, height: number): void;
}
//# sourceMappingURL=types.d.ts.map