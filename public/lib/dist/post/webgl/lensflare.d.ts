import * as THREE from 'three';
import { Lensflare } from 'three/addons/objects/Lensflare.js';
export interface LensflareElementSpec {
    texture: THREE.Texture;
    size?: number;
    distance?: number;
    color?: THREE.Color;
}
export interface LensflareOptions {
    elements?: LensflareElementSpec[];
}
export declare function createLensflare(options?: LensflareOptions): Lensflare;
//# sourceMappingURL=lensflare.d.ts.map