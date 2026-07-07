import type { Camera, Node, TextureNode } from 'three/webgpu';
export interface TraaOptions {
    depthThreshold?: number;
    edgeDepthDiff?: number;
    maxVelocityLength?: number;
    useSubpixelCorrection?: boolean;
}
export declare function createTraa(beautyNode: Node, depthNode: TextureNode, velocityNode: TextureNode, camera: Camera, options?: TraaOptions): import("three/addons/tsl/display/TRAANode.js").default;
//# sourceMappingURL=traa.d.ts.map