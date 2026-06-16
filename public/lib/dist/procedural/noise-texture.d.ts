import * as THREE from 'three';
export interface NoiseTextureOptions {
    size?: number;
    frequency?: number;
    octaves?: number;
    seed?: number;
    channels?: string;
}
export declare function createNoiseTexture({ size, frequency, octaves, seed, channels, }?: NoiseTextureOptions): THREE.DataTexture | null;
//# sourceMappingURL=noise-texture.d.ts.map