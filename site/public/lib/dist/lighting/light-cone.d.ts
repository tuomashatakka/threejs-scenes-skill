import * as THREE from 'three';
export interface LightConeOptions {
    color?: THREE.ColorRepresentation;
    /** Cone base radius as a fraction of its length. Default 0.16. */
    spread?: number;
}
export declare function createLightCone(from: THREE.Vector3, to: THREE.Vector3, { color, spread }?: LightConeOptions): THREE.Mesh;
//# sourceMappingURL=light-cone.d.ts.map