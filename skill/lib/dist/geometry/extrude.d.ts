import * as THREE from 'three';
export interface ExtrudeOptions {
    shape?: THREE.Shape | THREE.Shape[];
    points?: ReadonlyArray<readonly [number, number]>;
    depth?: number;
    bevel?: boolean;
    bevelThickness?: number;
    bevelSize?: number;
    bevelSegments?: number;
    steps?: number;
    curveSegments?: number;
    material?: THREE.Material;
}
export declare function createExtrudedMesh(options: ExtrudeOptions): THREE.Mesh;
export interface ExtrudeAlongPathOptions {
    steps?: number;
    bevel?: boolean;
    curveSegments?: number;
    material?: THREE.Material;
}
export declare function extrudeAlongPath(shape: THREE.Shape, path: THREE.Curve<THREE.Vector3>, options?: ExtrudeAlongPathOptions): THREE.Mesh;
//# sourceMappingURL=extrude.d.ts.map