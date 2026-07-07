import * as THREE from 'three';
import type { Axis } from './modifiers.js';
export interface Transform {
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
}
export declare function createGroup(children?: THREE.Object3D[], transform?: Transform): THREE.Group;
export interface GridLayout {
    cols?: number;
    spacing?: number;
    plane?: 'xz' | 'xy';
}
export declare function layoutGrid(objects: THREE.Object3D[], options?: GridLayout): THREE.Object3D[];
export interface RadialLayout {
    radius?: number;
    startAngle?: number;
    faceCenter?: boolean;
}
export declare function layoutRadial(objects: THREE.Object3D[], options?: RadialLayout): THREE.Object3D[];
export declare function layoutStack(objects: THREE.Object3D[], axis?: Axis, spacing?: number): THREE.Object3D[];
export declare function groupBounds(obj: THREE.Object3D): THREE.Box3;
//# sourceMappingURL=group.d.ts.map