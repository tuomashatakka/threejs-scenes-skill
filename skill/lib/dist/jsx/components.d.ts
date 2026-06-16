import * as THREE from 'three';
import { type ComposerHandle } from '../post/composer.js';
import type { FrameContext, SeededRng, FrameLoop } from '../types.js';
export interface ReactiveBinding {
    get: () => unknown;
    apply: (value: unknown) => void;
}
export interface Runtime {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    loop: FrameLoop;
    rng: SeededRng;
    getCamera(): THREE.Camera;
    setCamera(camera: THREE.Camera, isDefault?: boolean): void;
    getAspect(): number;
    getSize(): [number, number];
    addReactive(binding: ReactiveBinding): void;
    addDisposer(fn: () => void): void;
    addPostSetup(fn: () => void): void;
    setComposer(handle: ComposerHandle): void;
    disableOrbit(): void;
}
export interface Host {
    object: THREE.Object3D | null;
    container: THREE.Object3D | null;
    setProp(name: string, value: unknown): void;
    dispose(): void;
}
export declare function createHost(type: string, props: Record<string, unknown>, rt: Runtime): Host;
export declare const RAW_FUNCTION_PROPS: Set<string>;
export type { FrameContext };
//# sourceMappingURL=components.d.ts.map