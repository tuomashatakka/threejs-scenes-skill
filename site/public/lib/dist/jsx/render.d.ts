import * as THREE from 'three';
import type { SceneChild } from './jsx-runtime.js';
import type { FrameLoop } from '../types.js';
export interface RenderOptions {
    canvas: HTMLCanvasElement;
    seed?: number;
    background?: THREE.ColorRepresentation;
    orbit?: boolean;
}
export interface RenderHandle {
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    loop: FrameLoop;
    getCamera(): THREE.Camera;
    dispose(): void;
}
export declare function render(root: SceneChild, options: RenderOptions): RenderHandle;
//# sourceMappingURL=render.d.ts.map