import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { Disposable } from '../../types.js';
import type { WebGlPassContext } from './types.js';
export declare const BLOOM_LAYER = 1;
export interface SelectiveBloomOptions {
    strength?: number;
    radius?: number;
    threshold?: number;
}
export interface SelectiveBloomHandle extends Disposable {
    bloomComposer: EffectComposer;
    finalComposer: EffectComposer;
    bloom: UnrealBloomPass;
    markBloom(object: THREE.Object3D, recursive?: boolean): void;
    unmarkBloom(object: THREE.Object3D, recursive?: boolean): void;
    render(): void;
    setSize(width: number, height: number): void;
}
export declare function createSelectiveBloom(ctx: WebGlPassContext, options?: SelectiveBloomOptions): SelectiveBloomHandle;
//# sourceMappingURL=bloom-selective.d.ts.map