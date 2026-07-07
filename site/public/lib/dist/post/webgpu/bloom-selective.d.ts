import type { PassNode } from 'three/webgpu';
export interface BloomSelectiveOptions {
    strength?: number;
    radius?: number;
    threshold?: number;
}
export declare function createBloomSelective(scenePass: PassNode, options?: BloomSelectiveOptions): {
    output: import("three/webgpu").TextureNode;
    bloom: import("three/addons/tsl/display/BloomNode.js").default;
    result: import("three/webgpu").Node<"vec4">;
};
//# sourceMappingURL=bloom-selective.d.ts.map