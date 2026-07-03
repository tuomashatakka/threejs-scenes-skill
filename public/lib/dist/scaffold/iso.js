// lib/scaffold/iso.ts
// Isometric-scene scaffold: one call wires createApp with an orthographic iso
// camera, drag-to-pan in the ground plane, pinch/wheel zoom (frustum resize,
// not dolly), and an optional recentering infinite ground. Accepts a plain
// object, a store, or any { get, subscribe } controller as its state source.
import * as THREE from 'three';
import { createApp } from '../core/app.js';
import { attachPointerGesture } from '../core/pointer-gesture.js';
import { createIsoCamera, resizeIsoCamera } from '../camera/iso-camera.js';
import { createInfiniteGround } from '../geometry/infinite-ground.js';
import { resolveInitialState, bindStateSource } from '../state/controller.js';
export function createIsoScaffold({ state, viewSize = 20, flavor = 'dimetric', near, far, pan = true, zoom = [6, 80], ground: groundOptions, ...appOptions }) {
    const { canvas } = appOptions;
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = createIsoCamera(aspect, { viewSize, flavor, near, far });
    const app = createApp({
        ...appOptions,
        state: resolveInitialState(state, {}),
        camera,
        orbit: false,
        onResize: (width, height) => resizeIsoCamera(camera, width / height || 1),
    });
    const detachState = bindStateSource(app, state);
    // pan basis: camera right, and camera up flattened onto the ground plane —
    // dragging up moves the focus away from the viewer, like every iso builder.
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0);
    const forward = new THREE.Vector3()
        .setFromMatrixColumn(camera.matrix, 1)
        .setY(0)
        .normalize();
    const focus = new THREE.Vector3();
    const offset = camera.position.clone();
    let detachGesture = null;
    if (pan || zoom) {
        const applyZoom = (nextViewSize) => {
            if (!zoom)
                return;
            camera.userData.viewSize = Math.max(zoom[0], Math.min(zoom[1], nextViewSize));
            resizeIsoCamera(camera, canvas.clientWidth / canvas.clientHeight || 1);
        };
        detachGesture = attachPointerGesture(canvas, {
            onDrag(dx, dy) {
                if (!pan)
                    return;
                const worldPerPixel = camera.userData.viewSize / (canvas.clientHeight || 1);
                focus.addScaledVector(right, -dx * worldPerPixel);
                focus.addScaledVector(forward, dy * worldPerPixel);
                camera.position.copy(focus).add(offset);
            },
            onPinch(deltaScale) {
                applyZoom(camera.userData.viewSize / deltaScale);
            },
            onWheel(delta) {
                applyZoom(camera.userData.viewSize * (1 + delta * 0.001));
            },
        });
    }
    let ground = null;
    if (groundOptions) {
        ground = createInfiniteGround(groundOptions);
        app.ctx.scene.add(ground.object);
        app.ctx.loop.onFrame(() => ground.update(focus));
        ground.update(focus);
    }
    return {
        app,
        camera,
        focus,
        ground,
        dispose() {
            detachGesture?.();
            detachState();
            if (ground) {
                app.ctx.scene.remove(ground.object);
                ground.dispose();
            }
            app.dispose();
        },
    };
}
// perf: cheap on top of createApp — pan/zoom are event-driven; the ground
// recenter is O(tiles that crossed a cell boundary) per frame, usually zero.
//# sourceMappingURL=iso.js.map