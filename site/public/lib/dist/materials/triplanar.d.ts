import * as THREE from 'three';
export interface TriplanarMaterialOptions {
    /** [base A, base B, grid/accent]. */
    palette?: [THREE.ColorRepresentation, THREE.ColorRepresentation, THREE.ColorRepresentation];
    /** World units per grid cell (smaller = denser grid). Default 0.4. */
    tileScale?: number;
    /** Distance where the fog tint saturates. Default 40. */
    fogDistance?: number;
    side?: THREE.Side;
}
export declare function createTriplanarMaterial({ palette, tileScale, fogDistance, side, }?: TriplanarMaterialOptions): THREE.ShaderMaterial;
//# sourceMappingURL=triplanar.d.ts.map