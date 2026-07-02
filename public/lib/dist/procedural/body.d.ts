import * as THREE from 'three';
import type { Disposable, FrameContext } from '../types.js';
export interface ProceduralBodySpec {
    radius?: number;
    /** Icosahedron subdivision. 4 ≈ 5k tris, 5 ≈ 20k. */
    detail?: number;
    seed?: number;
    type?: 'terrestrial' | 'gas';
    /** Peak height as a fraction of radius (terrestrial). */
    displacement?: number;
    frequency?: number;
    octaves?: number;
    ridged?: boolean;
    /** Height palette, low -> high. */
    palette?: {
        low: THREE.ColorRepresentation;
        mid: THREE.ColorRepresentation;
        high: THREE.ColorRepresentation;
    };
    water?: {
        level: number;
        color: THREE.ColorRepresentation;
    } | null;
    clouds?: {
        coverage?: number;
        color?: THREE.ColorRepresentation;
    } | null;
    rings?: {
        inner: number;
        outer: number;
        color?: THREE.ColorRepresentation;
    } | null;
}
export interface ProceduralBody extends Disposable {
    object: THREE.Group;
    /** Slow cloud drift + body spin. */
    tick(ctx: FrameContext): void;
}
export declare function createProceduralBody({ radius, detail, seed, type, displacement, frequency, octaves, ridged, palette, water, clouds, rings, }?: ProceduralBodySpec): ProceduralBody;
//# sourceMappingURL=body.d.ts.map