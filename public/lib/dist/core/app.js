// lib/core/app.ts
// Unidirectional app shell: one store, one clock, one render loop. Data flows
// store -> module.update(state, frame) -> scene each tick; input handlers call
// app.setState()/dispatch(), never mutate the scene directly. All randomness
// derives from the injected seed. tick() pumps the simulation manually so the
// same seed + the same tick sequence reproduce the exact same world —
// deterministic replays and headless tests for free.
import * as THREE from 'three';
import { createRenderer, attachResizeObserver } from './renderer.js';
import { createFrameLoop } from './frame-loop.js';
import { attachPointerGesture } from './pointer-gesture.js';
import { disposeScene } from './dispose.js';
import { createClock } from './clock.js';
import { createStore } from './state.js';
import { setupStandardLighting } from '../lighting/lighting.js';
import { createSeededRng } from '../procedural/rng.js';
export function createApp({ canvas, state = {}, reducer, seed = 1, clock = createClock(), renderer: rendererOptions, camera: cameraOptions, background = '#0a0a14', lighting = true, orbit = true, modules = [], onFrame, }) {
    if (!canvas)
        throw new Error('createApp: canvas required');
    const renderer = createRenderer({ canvas, ...rendererOptions });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(background);
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(cameraOptions?.fov ?? 50, aspect, cameraOptions?.near ?? 0.1, cameraOptions?.far ?? 200);
    camera.position.set(...cameraOptions?.position ?? [4, 3, 6]);
    camera.lookAt(new THREE.Vector3(...cameraOptions?.lookAt ?? [0, 0, 0]));
    const lights = lighting ? setupStandardLighting(scene, renderer) : null;
    const store = createStore(state, reducer);
    const rng = createSeededRng(seed);
    const loop = createFrameLoop();
    const ctx = { scene, camera, renderer, rng, loop };
    // optional built-in orbit — input mutates state? no: the orbit is view-only
    // camera manipulation, deliberately outside app state (like scrolling a page).
    let detachGesture = null;
    if (orbit) {
        let theta = Math.atan2(camera.position.x, camera.position.z);
        let phi = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z));
        let radius = camera.position.length();
        const updateCamera = () => {
            const r = radius * Math.cos(phi);
            camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r);
            camera.lookAt(0, 0, 0);
        };
        detachGesture = attachPointerGesture(canvas, {
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
    }
    const detachResize = attachResizeObserver(renderer, camera, canvas);
    for (const module of modules)
        module.build(ctx);
    renderer.compile(scene, camera);
    // one simulation tick: state -> modules -> onFrame. Never the reverse.
    let frame = 0;
    function step(delta) {
        frame += 1;
        const frameCtx = { delta, elapsed: clock.elapsed(), frame };
        const current = store.get();
        for (const module of modules)
            module.update?.(current, frameCtx, ctx);
        onFrame?.(current, frameCtx, ctx);
    }
    function pump(realDelta) {
        for (const delta of clock.advance(realDelta))
            step(delta);
        renderer.render(scene, camera);
    }
    const stopFrame = loop.onFrame(({ delta }) => pump(delta));
    loop.stop();
    return {
        ctx,
        store,
        getState: store.get,
        setState: patch => store.set(patch),
        dispatch: action => store.dispatch(action),
        tick(realDelta = 1 / 60) {
            pump(realDelta);
        },
        start: () => loop.start(),
        stop: () => loop.stop(),
        dispose() {
            stopFrame();
            loop.dispose();
            detachGesture?.();
            detachResize();
            lights?.dispose();
            for (const module of modules)
                module.dispose();
            disposeScene(scene);
            renderer.dispose();
        },
    };
}
// perf: cheap scaffolding — one rAF, one Set iteration, one render per frame.
// Fixed-clock mode may run 0..maxSubSteps sim ticks per rAF but still renders once.
//# sourceMappingURL=app.js.map