import * as THREE from 'three';
import type { PropInstance } from '../types.js';
export interface CompositePart {
    prop: PropInstance;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
}
export interface PropComposite {
    object: THREE.Group;
    parts: PropInstance[];
    dispose(): void;
}
export declare function createPropComposite(parts: CompositePart[]): PropComposite;
//# sourceMappingURL=composite.d.ts.map