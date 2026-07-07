import type { Node, PerspectiveCamera } from 'three/webgpu';
export interface SsgiOptions {
    sliceCount?: number;
    stepCount?: number;
    aoIntensity?: number;
    giIntensity?: number;
    radius?: number;
    useScreenSpaceSampling?: boolean;
    expFactor?: number;
    thickness?: number;
    useLinearThickness?: boolean;
    backfaceLighting?: number;
    useTemporalFiltering?: boolean;
}
export declare function createSsgi(beautyNode: Node, depthNode: Node, normalNode: Node, camera: PerspectiveCamera, options?: SsgiOptions): import("three/addons/tsl/display/SSGINode.js").default;
//# sourceMappingURL=ssgi.d.ts.map