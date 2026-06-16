// lib/core/scene-bootstrap.ts
// Minimal scene bootstrap. Wires renderer + scene + camera + frame loop +
// pointer gesture + resize observer + dispose path. Copy this as a starting
// point for any new scene. Ported from scripts/scene-bootstrap.js, using the
// self-contained createFrameLoop instead of the external framecapper.
import * as THREE from 'three';
import { createRenderer, attachResizeObserver } from './renderer.js';
import { createFrameLoop } from './frame-loop.js';
import { attachPointerGesture } from './pointer-gesture.js';
import { disposeScene } from './dispose.js';
import { setupStandardLighting } from '../lighting/lighting.js';
export function bootstrapScene({ canvas, onSetup }) {
    if (!canvas)
        throw new Error('canvas required');
    const renderer = createRenderer({ canvas });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0a0a14');
    const aspect = canvas.clientWidth / canvas.clientHeight;
    const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200);
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 0, 0);
    const lighting = setupStandardLighting(scene, renderer);
    const loop = createFrameLoop();
    // pointer-driven camera orbit
    let theta = Math.atan2(camera.position.x, camera.position.z);
    let phi = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z));
    let radius = camera.position.length();
    function updateCamera() {
        const r = radius * Math.cos(phi);
        camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r);
        camera.lookAt(0, 0, 0);
    }
    const detachGesture = attachPointerGesture(canvas, {
        onDrag(dx, dy) {
            theta -= dx * 0.005;
            phi = Math.max(-1.4, Math.min(1.4, phi + dy * 0.005));
            updateCamera();
        },
        onPinch(deltaScale) {
            radius = Math.max(2, Math.min(50, radius / deltaScale));
            updateCamera();
        },
        onWheel(delta) {
            radius = Math.max(2, Math.min(50, radius * (1 + delta * 0.001)));
            updateCamera();
        },
    });
    const detachResize = attachResizeObserver(renderer, camera, canvas);
    // user content
    const userTicks = [];
    if (onSetup) {
        const tick = onSetup({ scene, camera, renderer, loop });
        if (tick)
            userTicks.push(tick);
    }
    // pre-warm shaders so the first frame doesn't stall
    renderer.compile(scene, camera);
    // single combined frame callback: user ticks, then render.
    const stopFrame = loop.onFrame((ctx) => {
        for (const t of userTicks)
            t(ctx);
        renderer.render(scene, camera);
    });
    function dispose() {
        stopFrame();
        loop.dispose();
        detachGesture();
        detachResize();
        lighting.dispose();
        disposeScene(scene);
        renderer.dispose();
    }
    return { renderer, scene, camera, loop, dispose };
}
// perf: cheap. one renderer, one scene, one camera, one rAF.
//# sourceMappingURL=scene-bootstrap.js.map