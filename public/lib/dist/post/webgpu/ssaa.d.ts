import * as THREE from 'three';
export interface SsaaOptions {
    sampleLevel?: number;
    unbiased?: boolean;
}
export declare function createSsaaPass(scene: THREE.Scene, camera: THREE.Camera, options?: SsaaOptions): import("three/addons/tsl/display/SSAAPassNode.js").default;
//# sourceMappingURL=ssaa.d.ts.map