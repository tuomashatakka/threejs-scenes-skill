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
/**
 * @deprecated Use {@link createEmitter} from './emitter.js' — it adds shapes,
 * rate/burst emission, over-lifetime curves, and cadence-independent
 * determinism (this emitter's respawn consumes its RNG in tick order, so the
 * same seed can produce different runs).
 */
export declare function createParticleEmitter({ count, texture, bounds, seed, gravity, damping, }: ParticleEmitterOptions): ParticleEmitter;
//# sourceMappingURL=cpu-particles.d.ts.map