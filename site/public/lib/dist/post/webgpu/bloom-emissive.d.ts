import type { PassNode } from 'three/webgpu';
export interface BloomEmissiveOptions {
    strength?: number;
    radius?: number;
    threshold?: number;
}
export declare function createBloomEmissive(scenePass: PassNode, options?: BloomEmissiveOptions): {
    output: import("three/webgpu").TextureNode;
    bloom: import("three/addons/tsl/display/BloomNode.js").default;
    result: import("three/webgpu").Node<"vec4">;
};
//# sourceMappingURL=bloom-emissive.d.ts.map