import * as THREE from 'three';
export type Vec3Tuple = readonly [number, number, number];
/** A serializable camera intent: where to stand and what to look at. */
export interface CameraTarget {
    position: Vec3Tuple;
    lookAt: Vec3Tuple;
}
export declare function tupleToVector3(tuple: Vec3Tuple, out?: THREE.Vector3): THREE.Vector3;
export declare function vector3ToTuple(v: THREE.Vector3): Vec3Tuple;
/** Frame an object: stand `distance` away along `direction`, look at its center. */
export declare function targetFromObject(object: THREE.Object3D, distance: number, direction?: Vec3Tuple): CameraTarget;
//# sourceMappingURL=targets.d.ts.map