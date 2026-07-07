import * as THREE from 'three';
import type { FrameContext } from '../types.js';
export interface HolographicMaterialOptions {
    baseColor?: THREE.ColorRepresentation;
    fresnelStrength?: number;
    scanlineDensity?: number;
    opacity?: number;
}
export interface TickableMaterial extends THREE.ShaderMaterial {
    userData: {
        tick: (ctx: FrameContext) => void;
    };
}
export declare function createHolographicMaterial({ baseColor, fresnelStrength, scanlineDensity, opacity, }?: HolographicMaterialOptions): TickableMaterial;
//# sourceMappingURL=holographic-material.d.ts.map