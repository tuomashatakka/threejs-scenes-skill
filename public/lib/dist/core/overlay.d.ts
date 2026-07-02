import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import type { Disposable } from '../types.js';
export interface OverlayHandle extends Disposable {
    scene: THREE.Scene;
    /** Add after the main render pass: pipeline.register('overlay', overlay.pass). */
    pass: RenderPass;
}
export declare function createOverlayScene(camera: THREE.Camera): OverlayHandle;
/** Composer-free path: call after renderer.render(mainScene, camera). */
export declare function renderOverlay(renderer: THREE.WebGLRenderer, overlayScene: THREE.Scene, camera: THREE.Camera): void;
//# sourceMappingURL=overlay.d.ts.map