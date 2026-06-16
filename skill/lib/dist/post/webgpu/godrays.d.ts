import type { Camera, DirectionalLight, PointLight, TextureNode } from 'three/webgpu';
export interface GodraysOptions {
    raymarchSteps?: number;
    density?: number;
    maxDensity?: number;
    distanceAttenuation?: number;
    resolutionScale?: number;
}
export declare function createGodrays(depthNode: TextureNode, camera: Camera, light: DirectionalLight | PointLight, options?: GodraysOptions): import("three/addons/tsl/display/GodraysNode.js").default;
//# sourceMappingURL=godrays.d.ts.map