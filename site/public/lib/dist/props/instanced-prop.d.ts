import * as THREE from 'three';
import type { InstancePlaceFn, PropContext, PropFactory } from '../types.js';
export interface InstancedPropOptions {
    count: number;
    radius?: number;
    seed?: number;
    place?: InstancePlaceFn;
}
export interface InstancedPropResult {
    object: THREE.Object3D;
    dispose(): void;
}
export declare function createInstancedProp(factory: PropFactory, options: InstancedPropOptions, ctx?: PropContext): InstancedPropResult;
//# sourceMappingURL=instanced-prop.d.ts.map