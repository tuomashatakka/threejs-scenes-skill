// lib/core/overlay.ts
// Overlay-scene compositing: a second scene (HUD, gizmos, selection markers)
// rendered on top of the main scene with depth cleared, so overlay objects are
// never occluded by world geometry. Two integration paths: a RenderPass for a
// composer/pipeline chain, or renderOverlay() after a plain renderer.render().
import * as THREE from 'three';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { disposeScene } from './dispose.js';
export function createOverlayScene(camera) {
    const scene = new THREE.Scene();
    const pass = new RenderPass(scene, camera);
    pass.clear = false;
    pass.clearDepth = true;
    return {
        scene,
        pass,
        dispose() {
            disposeScene(scene);
        },
    };
}
/** Composer-free path: call after renderer.render(mainScene, camera). */
export function renderOverlay(renderer, overlayScene, camera) {
    renderer.clearDepth();
    renderer.render(overlayScene, camera);
}
// perf: one extra render pass over (usually few) overlay objects.
//# sourceMappingURL=overlay.js.map