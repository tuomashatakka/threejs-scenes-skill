// lib/jsx/render.ts
// render() — the JSX entry point. Bootstraps renderer + scene + frame loop,
// mounts the element tree, then drives everything from ONE frame callback:
// apply reactive bindings, advance, render (through the composer if a <post>
// element built one). Reconciliation is the render tick — no separate scheduler.
// Returns a handle whose dispose() tears down the whole graph.
import * as THREE from 'three';
import { createRenderer, attachResizeObserver } from '../core/renderer.js';
import { createFrameLoop } from '../core/frame-loop.js';
import { attachPointerGesture } from '../core/pointer-gesture.js';
import { disposeScene } from '../core/dispose.js';
import { resizeIsoCamera } from '../camera/iso-camera.js';
import { createSeededRng } from '../procedural/rng.js';
import { mountTree } from './reconciler.js';
export function render(root, options) {
    const { canvas, seed = 1, orbit = true } = options;
    if (!canvas)
        throw new Error('render: a canvas is required');
    const renderer = createRenderer({ canvas });
    const scene = new THREE.Scene();
    if (options.background !== undefined)
        scene.background = new THREE.Color(options.background);
    const loop = createFrameLoop();
    const rng = createSeededRng(seed);
    const size = new THREE.Vector2();
    const getSize = () => {
        renderer.getSize(size);
        return [size.x, size.y];
    };
    const getAspect = () => {
        const [w, h] = getSize();
        return w / (h || 1);
    };
    let camera = new THREE.PerspectiveCamera(50, getAspect(), 0.1, 500);
    camera.position.set(4, 3, 6);
    camera.lookAt(0, 0, 0);
    let cameraChosen = false;
    let manualCamera = false;
    let composer = null;
    const reactive = [];
    const disposers = [];
    const postSetups = [];
    const rt = {
        scene,
        renderer,
        loop,
        rng,
        getCamera: () => camera,
        setCamera(cam, isDefault = true) {
            if (!cameraChosen || isDefault) {
                camera = cam;
                cameraChosen = true;
            }
        },
        getAspect,
        getSize,
        addReactive: b => reactive.push(b),
        addDisposer: fn => disposers.push(fn),
        addPostSetup: fn => postSetups.push(fn),
        setComposer: h => { composer = h; },
        disableOrbit() { manualCamera = true; },
    };
    mountTree(root, rt);
    for (const setup of postSetups)
        setup();
    // orbit controls on a perspective camera unless a follow/manual camera owns it
    let detachGesture = () => { };
    if (orbit && !manualCamera && camera.isPerspectiveCamera) {
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
                radius = Math.max(2, Math.min(80, radius / deltaScale));
                updateCamera();
            },
            onWheel(delta) {
                radius = Math.max(2, Math.min(80, radius * (1 + delta * 0.001)));
                updateCamera();
            },
        });
    }
    const detachResize = attachResizeObserver(renderer, camera, canvas, (w, h) => {
        composer?.setSize(w, h);
        const cam = camera;
        if (cam.isOrthographicCamera)
            resizeIsoCamera(cam, w / (h || 1));
    });
    renderer.compile(scene, camera);
    const stopFrame = loop.onFrame(ctx => {
        for (const binding of reactive)
            binding.apply(binding.get());
        if (composer)
            composer.composer.render(ctx.delta);
        else
            renderer.render(scene, camera);
    });
    function dispose() {
        stopFrame();
        loop.dispose();
        detachGesture();
        detachResize();
        for (const d of disposers)
            d();
        composer?.dispose();
        disposeScene(scene);
        renderer.dispose();
    }
    return { scene, renderer, loop, getCamera: () => camera, dispose };
}
// perf: one rAF, one render per frame. Reactive cost = #reactive-props function
// calls per frame. Everything is disposed in dispose() — no GPU leak on unmount.
//# sourceMappingURL=render.js.map