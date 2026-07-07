import * as THREE from 'three';
export interface InstancePlacement {
    object: THREE.Object3D;
    color: THREE.Color;
}
export type PlaceFn = (index: number, rng: () => number, object: THREE.Object3D, color: THREE.Color) => void;
export interface InstancedFieldOptions {
    geometry: THREE.BufferGeometry;
    material: THREE.Material;
    count: number;
    radius?: number;
    seed?: number;
    hueBase?: number;
    hueSpread?: number;
    scaleMin?: number;
    scaleMax?: number;
    place?: PlaceFn;
}
export declare function createInstancedField({ geometry, material, count, radius, seed, hueBase, hueSpread, scaleMin, scaleMax, place, }: InstancedFieldOptions): THREE.InstancedMesh;
//# sourceMappingURL=instanced-field.d.ts.map