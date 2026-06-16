import type { Node } from 'three/webgpu';
export interface LensflareOptions {
    ghostTint?: Node;
    threshold?: number;
    ghostSamples?: number;
    ghostSpacing?: number;
    ghostAttenuationFactor?: number;
    downSampleRatio?: number;
}
export declare function createLensflare(input: Node, options?: LensflareOptions): import("three/addons/tsl/display/LensflareNode.js").default;
//# sourceMappingURL=lensflare.d.ts.map