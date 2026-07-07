import * as THREE from 'three';
export interface LatheOptions {
    segments?: number;
    phiStart?: number;
    phiLength?: number;
    material?: THREE.Material;
}
export declare function createLatheMesh(profile: ReadonlyArray<readonly [number, number] | THREE.Vector2>, options?: LatheOptions): THREE.Mesh;
//# sourceMappingURL=lathe.d.ts.map