import * as THREE from 'three';
export interface BatchedBuildingsOptions {
    geometries: THREE.BufferGeometry[];
    material: THREE.Material;
    transforms: THREE.Matrix4[];
    sortObjects?: boolean;
    perObjectFrustumCulled?: boolean;
}
export declare function createBatchedBuildings({ geometries, material, transforms, sortObjects, perObjectFrustumCulled, }: BatchedBuildingsOptions): THREE.BatchedMesh;
//# sourceMappingURL=batched-buildings.d.ts.map