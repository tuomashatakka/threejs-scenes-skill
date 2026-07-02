import * as THREE from 'three';
import type { ScalarCurve, ColorCurve } from './curves.js';
import type { FrameContext } from '../types.js';
export type EmitterShape = {
    kind: 'point';
} | {
    kind: 'sphere';
    radius: number;
    shell?: boolean;
} | {
    kind: 'box';
    size: readonly [number, number, number];
} | {
    kind: 'cone';
    angle: number;
    radius?: number;
} | {
    kind: 'disc';
    radius: number;
};
export interface EmitterOptions {
    /** Max simultaneously-live particles. Buffers are sized once at this count. */
    capacity: number;
    /** Continuous emission in particles/second. Default: capacity / mean lifetime. */
    rate?: number;
    /** One-shot emissions at sim-time offsets (seconds since emitter creation). */
    bursts?: ReadonlyArray<{
        time: number;
        count: number;
    }>;
    lifetime?: readonly [number, number];
    shape?: EmitterShape;
    /** Initial speed range along the shape's emission direction. */
    speed?: readonly [number, number];
    gravity?: readonly [number, number, number];
    damping?: number;
    /** World-unit base size; the size curve multiplies this. */
    size?: number;
    sizeCurve?: ScalarCurve;
    color?: ColorCurve;
    alphaCurve?: ScalarCurve;
    /** Angular velocity range (rad/s) for sprite spin. */
    rotation?: readonly [number, number];
    texture?: THREE.Texture | null;
    blending?: 'additive' | 'normal';
    seed?: number;
}
export interface Emitter {
    object: THREE.Object3D;
    tick(ctx: FrameContext): void;
    /** Spawn `count` particles immediately (capacity permitting). */
    burst(count: number): void;
    setRate(rate: number): void;
    dispose(): void;
}
export interface SpawnSample {
    px: number;
    py: number;
    pz: number;
    dx: number;
    dy: number;
    dz: number;
}
/** Sample a spawn position + emission direction from an emitter shape. */
export declare function sampleShape(shape: EmitterShape, r: () => number, out: SpawnSample): void;
export declare function createEmitter({ capacity, rate, bursts, lifetime, shape, speed, gravity, damping, size, sizeCurve, color, alphaCurve, rotation, texture, blending, seed, }: EmitterOptions): Emitter;
//# sourceMappingURL=emitter.d.ts.map