import * as THREE from 'three';
export interface ScreenProjection {
    /** Screen position in 0..1 UV space (0,0 = bottom-left, matches shader vUv). */
    u: number;
    v: number;
    /** NDC depth; > 1 means beyond far plane, < -1 in front of near. */
    ndcZ: number;
    onScreen: boolean;
}
export declare function projectToScreenUv(object: THREE.Object3D, camera: THREE.Camera, out?: ScreenProjection): ScreenProjection;
//# sourceMappingURL=projection.d.ts.map