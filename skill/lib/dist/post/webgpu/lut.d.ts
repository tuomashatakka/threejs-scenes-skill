import type { Data3DTexture } from 'three';
import type { ColorNode } from './types.js';
export interface LutOptions {
    lut: Data3DTexture;
    intensity?: number;
}
export declare function createLut(input: ColorNode, options: LutOptions): import("three/addons/tsl/display/Lut3DNode.js").default;
//# sourceMappingURL=lut.d.ts.map