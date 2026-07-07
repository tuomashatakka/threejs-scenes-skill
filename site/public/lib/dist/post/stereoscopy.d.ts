import type * as THREE from 'three';
import type { Disposable } from '../types.js';
export type StereoMode = 'anaglyph' | 'stereo' | 'off';
export interface StereoRenderer extends Disposable {
    mode: StereoMode;
    render(scene: THREE.Scene, camera: THREE.Camera): void;
    setSize(w: number, h: number): void;
}
export interface StereoSizeOptions {
    width?: number;
    height?: number;
}
export declare function createStereoRenderer(renderer: THREE.WebGLRenderer, mode: StereoMode, { width, height }?: StereoSizeOptions): StereoRenderer;
//# sourceMappingURL=stereoscopy.d.ts.map