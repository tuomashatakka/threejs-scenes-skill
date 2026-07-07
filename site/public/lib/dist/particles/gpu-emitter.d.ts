import * as THREE from 'three';
import type { Emitter, EmitterOptions } from './emitter.js';
export type GpuEmitterOptions = Omit<EmitterOptions, 'rate' | 'bursts' | 'rotation'>;
export declare function createGpuEmitter(renderer: THREE.WebGLRenderer, options: GpuEmitterOptions): Emitter;
//# sourceMappingURL=gpu-emitter.d.ts.map