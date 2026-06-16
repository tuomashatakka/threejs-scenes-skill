import type { Camera, DirectionalLight, TextureNode } from 'three/webgpu';
export interface SssOptions {
    maxDistance?: number;
    thickness?: number;
    shadowIntensity?: number;
    quality?: number;
    resolutionScale?: number;
    useTemporalFiltering?: boolean;
}
export declare function createSss(depthNode: TextureNode, camera: Camera, mainLight: DirectionalLight, options?: SssOptions): import("three/addons/tsl/display/SSSNode.js").default;
//# sourceMappingURL=sss.d.ts.map