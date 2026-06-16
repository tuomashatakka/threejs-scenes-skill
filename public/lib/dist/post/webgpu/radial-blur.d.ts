import type { ColorNode } from './types.js';
export interface RadialBlurOptions {
    weight?: number;
    decay?: number;
    exposure?: number;
    count?: number;
}
export declare function createRadialBlur(input: ColorNode, options?: RadialBlurOptions): import("three/webgpu").Node;
//# sourceMappingURL=radial-blur.d.ts.map