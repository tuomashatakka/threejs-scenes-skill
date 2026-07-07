import * as THREE from 'three';
import type { Node } from 'three/webgpu';
import type { ColorNode } from './types.js';
export interface DofOptions {
    focusDistance?: number;
    focalLength?: number;
    bokehScale?: number;
}
export declare function createDof(input: ColorNode, viewZ: ColorNode, options?: DofOptions): import("three/addons/tsl/display/DepthOfFieldNode.js").default;
export interface DofBasicOptions {
    focusPoint?: THREE.Vector3;
    minDistance?: number;
    maxDistance?: number;
    blurSize?: number;
    blurSpread?: number;
}
export declare function createDofBasic(input: Node<'vec4'>, viewZ: Node<'float'>, options?: DofBasicOptions): Node<"vec4">;
//# sourceMappingURL=dof.d.ts.map