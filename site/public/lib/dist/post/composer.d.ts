import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { Disposable } from '../types.js';
export interface ComposerOptions {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    width: number;
    height: number;
    withDepth?: boolean;
    withBloom?: boolean;
    bloomStrength?: number;
    bloomRadius?: number;
    bloomThreshold?: number;
}
export interface ComposerHandle extends Disposable {
    composer: EffectComposer;
    bloom: UnrealBloomPass | null;
    output: OutputPass;
    setSize(w: number, h: number): void;
    addPassBeforeOutput(pass: Pass): void;
}
export declare function createComposer({ renderer, scene, camera, width, height, withDepth, withBloom, bloomStrength, bloomRadius, bloomThreshold, }: ComposerOptions): ComposerHandle;
//# sourceMappingURL=composer.d.ts.map