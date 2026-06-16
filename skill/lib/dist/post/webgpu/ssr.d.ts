import type { Camera, Node } from 'three/webgpu';
export interface SsrOptions {
    maxDistance?: number;
    thickness?: number;
    opacity?: number;
    quality?: number;
    blurQuality?: number;
    resolutionScale?: number;
}
export declare function createSsr(colorNode: Node, depthNode: Node, normalNode: Node, metalness: Node, roughness: Node, camera: Camera, options?: SsrOptions): import("three/addons/tsl/display/SSRNode.js").default;
//# sourceMappingURL=ssr.d.ts.map