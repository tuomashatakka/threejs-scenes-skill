import * as THREE from 'three';
/** [t, value] stops, t in 0..1 ascending. */
export type ScalarCurve = ReadonlyArray<readonly [number, number]>;
/** [t, color] stops; color as css string or [r,g,b] in 0..1. */
export type ColorCurve = ReadonlyArray<readonly [number, string | readonly [number, number, number]]>;
/**
 * Sample a scalar curve at t. Linear interpolation between stops — chosen over
 * smoothstep/Catmull-Rom because stops are author-controlled: add a stop where
 * you want an ease, and the LUT resolution (64) hides the corners anyway.
 */
export declare function sampleCurve(curve: ScalarCurve, t: number): number;
/** Bake a scalar curve into a Float32Array LUT of `resolution` samples. */
export declare function bakeCurve(curve: ScalarCurve, resolution?: number): Float32Array;
/**
 * Bake color + alpha + size curves into one 2-row RGBA DataTexture:
 * row 0 = rgb: color, a: alpha; row 1 = r: size. Sampled in the particle
 * shaders by normalized age.
 */
export declare function bakeCurveTexture(color: ColorCurve, alpha: ScalarCurve, size: ScalarCurve, resolution?: number): THREE.DataTexture;
//# sourceMappingURL=curves.d.ts.map