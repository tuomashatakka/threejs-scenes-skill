import * as THREE from 'three';
import type { FrameContext } from '../types.js';
export interface ParticleEmitterOptions {
    count: number;
    texture: THREE.Texture;
    bounds?: number;
    seed?: number;
    gravity?: number;
    damping?: number;
}
export interface ParticleEmitter {
    mesh: THREE.Mesh;
    tick(ctx: FrameContext): void;
    dispose(): void;
}
export declare function createParticleEmitter({ count, texture, bounds, seed, gravity, damping, }: ParticleEmitterOptions): ParticleEmitter;
//# sourceMappingURL=cpu-particles.d.ts.map