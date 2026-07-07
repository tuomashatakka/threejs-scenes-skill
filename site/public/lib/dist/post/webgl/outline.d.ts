import * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { WebGlPassContext } from './types.js';
export interface OutlineOptions {
    selectedObjects?: THREE.Object3D[];
    edgeStrength?: number;
    edgeGlow?: number;
    edgeThickness?: number;
    pulsePeriod?: number;
    visibleEdgeColor?: THREE.ColorRepresentation;
    hiddenEdgeColor?: THREE.ColorRepresentation;
}
export declare function createOutline(ctx: WebGlPassContext, options?: OutlineOptions): Pass;
//# sourceMappingURL=outline.d.ts.map