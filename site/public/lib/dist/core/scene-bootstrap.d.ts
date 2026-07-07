import * as THREE from 'three';
import type { FrameCallback, FrameLoop } from '../types.js';
export interface BootstrapSetupContext {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    loop: FrameLoop;
}
export type BootstrapSetup = (ctx: BootstrapSetupContext) => FrameCallback | void;
export interface BootstrapOptions {
    canvas: HTMLCanvasElement;
    onSetup?: BootstrapSetup;
}
export interface BootstrappedScene {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    loop: FrameLoop;
    dispose(): void;
}
export declare function bootstrapScene({ canvas, onSetup }: BootstrapOptions): BootstrappedScene;
//# sourceMappingURL=scene-bootstrap.d.ts.map