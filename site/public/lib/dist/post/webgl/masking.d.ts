import type * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface MaskLayer {
    mask: Pass;
    clear: Pass;
}
export declare function createMaskPasses(maskScene: THREE.Scene, maskCamera: THREE.Camera, options?: {
    inverse?: boolean;
}): MaskLayer;
//# sourceMappingURL=masking.d.ts.map