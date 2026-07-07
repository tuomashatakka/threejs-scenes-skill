import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface BloomOptions {
    strength?: number;
    radius?: number;
    threshold?: number;
    width?: number;
    height?: number;
}
export declare function createBloom(options?: BloomOptions): Pass;
//# sourceMappingURL=bloom.d.ts.map