import * as THREE from 'three';
export type PickFilter = (object: THREE.Object3D) => boolean;
export interface PickResult {
    object: THREE.Object3D;
    topLevel: THREE.Object3D;
    point: THREE.Vector3;
    distance: number;
}
export declare function pickTopLevel(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, isPickable?: PickFilter): PickResult | null;
//# sourceMappingURL=pick.d.ts.map