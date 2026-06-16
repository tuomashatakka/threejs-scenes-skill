import * as THREE from 'three';
import type { ColorNode } from './types.js';
export interface ChromaticAberrationOptions {
    strength?: number;
    center?: THREE.Vector2;
    scale?: number;
}
export declare function createChromaticAberration(input: ColorNode, options?: ChromaticAberrationOptions): import("three/addons/tsl/display/ChromaticAberrationNode.js").default;
//# sourceMappingURL=ca.d.ts.map