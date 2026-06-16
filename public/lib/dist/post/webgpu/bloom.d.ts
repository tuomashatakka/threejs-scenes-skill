import type { ColorNode } from './types.js';
export interface BloomOptions {
    strength?: number;
    radius?: number;
    threshold?: number;
}
export declare function createBloom(input: ColorNode, options?: BloomOptions): import("three/addons/tsl/display/BloomNode.js").default;
//# sourceMappingURL=bloom.d.ts.map