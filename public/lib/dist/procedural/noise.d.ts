export interface Noise3D {
    /** Single octave, output roughly in [-1, 1]. */
    sample(x: number, y: number, z: number): number;
    /** Fractal Brownian motion, output roughly in [-1, 1]. */
    fbm(x: number, y: number, z: number, octaves?: number, lacunarity?: number, gain?: number): number;
    /** Ridged multifractal, output in [0, 1] — sharp crests, good for mountains. */
    ridged(x: number, y: number, z: number, octaves?: number, lacunarity?: number, gain?: number): number;
}
export declare function createNoise3D(seed?: number): Noise3D;
//# sourceMappingURL=noise.d.ts.map