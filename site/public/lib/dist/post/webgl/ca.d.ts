import * as THREE from 'three';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
export interface ChromaticAberrationOptions {
    strength?: number;
    center?: THREE.Vector2;
    scale?: number;
}
export declare function createChromaticAberration(options?: ChromaticAberrationOptions): Pass;
//# sourceMappingURL=ca.d.ts.map