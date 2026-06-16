import * as THREE from 'three';
import type { Node } from 'three/webgpu';
export interface RetroOptions {
    affineDistortion?: Node | null;
    filterTextures?: boolean;
}
export declare function createRetroPass(scene: THREE.Scene, camera: THREE.Camera, options?: RetroOptions): import("three/addons/tsl/display/RetroPassNode.js").default;
//# sourceMappingURL=retro.d.ts.map