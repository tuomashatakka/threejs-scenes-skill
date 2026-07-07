import * as THREE from 'three';
import type { SeededRng } from '../types.js';
export type Axis = 'x' | 'y' | 'z';
/** Twist around `axis`: rotation grows linearly from 0 to `angle` along the axis. */
export declare function applyTwist(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
/** Taper: the two axes perpendicular to `axis` scale from 1 to `factor` along it. */
export declare function applyTaper(geo: THREE.BufferGeometry, factor: number, axis?: Axis): THREE.BufferGeometry;
/** Bend the geometry into an arc of `angle` radians around its `axis` extent. */
export declare function applyBend(geo: THREE.BufferGeometry, angle: number, axis?: Axis): THREE.BufferGeometry;
export interface NoiseDisplaceOptions {
    amp?: number;
    freq?: number;
    seed?: number;
    rng?: SeededRng;
}
/** Push each vertex along its normal by seeded value noise. Great for rocks/terrain. */
export declare function displaceByNoise(geo: THREE.BufferGeometry, options?: NoiseDisplaceOptions): THREE.BufferGeometry;
/** Collapse to roughly `targetCount` vertices via SimplifyModifier. */
export declare function simplifyGeometry(geo: THREE.BufferGeometry, targetCount: number): THREE.BufferGeometry;
/** Subdivide long edges. `maxEdgeLength` in world units, `iterations` passes. */
export declare function tessellateGeometry(geo: THREE.BufferGeometry, maxEdgeLength?: number, iterations?: number): THREE.BufferGeometry;
/** Split shared vertices across hard edges so flat-shaded creases stay sharp. */
export declare function edgeSplit(geo: THREE.BufferGeometry, cutOffAngleRad?: number, keepNormals?: boolean): THREE.BufferGeometry;
/** Weld duplicate vertices within `tolerance` (indexes the geometry). */
export declare function mergeVertices(geo: THREE.BufferGeometry, tolerance?: number): THREE.BufferGeometry;
export declare function recomputeNormals(geo: THREE.BufferGeometry): THREE.BufferGeometry;
//# sourceMappingURL=modifiers.d.ts.map