import type { SeededRng } from '../types.js';
export declare function mulberry32(seed: number): () => number;
export declare function hash2(x: number, y: number): number;
export declare function hash3(x: number, y: number, z: number): number;
export declare function lerp(a: number, b: number, t: number): number;
export declare function smoothstep(edge0: number, edge1: number, x: number): number;
export declare function createSeededRng(seed: number): SeededRng;
//# sourceMappingURL=rng.d.ts.map