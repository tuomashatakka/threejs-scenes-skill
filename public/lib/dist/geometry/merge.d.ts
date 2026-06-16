import * as THREE from 'three';
/**
 * Merge `meshes` into a single Mesh when they share one material, or a Group of
 * merged meshes (one per distinct material) otherwise. Each mesh's local matrix
 * is baked into the merged geometry. The source meshes are left untouched.
 */
export declare function mergeMeshes(meshes: THREE.Mesh[]): THREE.Object3D;
/** Merge a raw list of geometries (assumed already in a common space). */
export declare function mergeGeometryList(geometries: THREE.BufferGeometry[], useGroups?: boolean): THREE.BufferGeometry;
//# sourceMappingURL=merge.d.ts.map