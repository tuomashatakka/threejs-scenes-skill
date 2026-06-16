import type { ColorNode } from './types.js';
export interface AnamorphicOptions {
    threshold?: number;
    scale?: number;
    samples?: number;
    resolutionScale?: number;
}
export declare function createAnamorphic(input: ColorNode, options?: AnamorphicOptions): import("three/addons/tsl/display/AnamorphicNode.js").default;
//# sourceMappingURL=anamorphic.d.ts.map