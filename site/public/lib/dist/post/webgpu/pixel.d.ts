import * as THREE from 'three';
export interface PixelOptions {
    pixelSize?: number;
    normalEdgeStrength?: number;
    depthEdgeStrength?: number;
}
export declare function createPixelationPass(scene: THREE.Scene, camera: THREE.Camera, options?: PixelOptions): import("three/addons/tsl/display/PixelationPassNode.js").default;
//# sourceMappingURL=pixel.d.ts.map