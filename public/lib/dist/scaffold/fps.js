// lib/scaffold/fps.ts
// First-person scaffold: pointer-lock mouse look + WASD/arrow movement intent
// applied to the camera in the ground plane, with optional collision and
// ground-height hooks. Movement is state-of-the-input -> camera each frame,
// framerate-independent; nothing writes back into app state.
import * as THREE from 'three';
import { createApp } from '../core/app.js';
import { resolveInitialState, bindStateSource } from '../state/controller.js';
const scratchNext = new THREE.Vector3();
export function createFpsScaffold({ state, speed = 5, lookSpeed = 0.0022, eyeHeight = 1.7, pointerLock = true, collide, groundHeight, ...appOptions }) {
    const { canvas } = appOptions;
    const app = createApp({
        ...appOptions,
        state: resolveInitialState(state, {}),
        orbit: false,
        camera: appOptions.camera ?? { position: [0, eyeHeight, 0], lookAt: [0, eyeHeight, -1] },
    });
    const detachState = bindStateSource(app, state);
    const camera = app.ctx.camera;
    camera.rotation.order = 'YXZ';
    let yaw = camera.rotation.y;
    let pitch = camera.rotation.x;
    let dragging = false;
    const pressed = new Set();
    const isLocked = () => typeof document !== 'undefined' && document.pointerLockElement === canvas;
    const onPointerDown = (event) => {
        dragging = true;
        canvas.setPointerCapture(event.pointerId);
        if (pointerLock && !isLocked())
            canvas.requestPointerLock?.();
    };
    const onPointerUp = () => {
        dragging = false;
    };
    const onPointerMove = (event) => {
        if (!isLocked() && !dragging)
            return;
        yaw -= event.movementX * lookSpeed;
        pitch = Math.max(-1.45, Math.min(1.45, pitch - event.movementY * lookSpeed));
    };
    const onKeyDown = (event) => {
        pressed.add(event.code);
    };
    const onKeyUp = (event) => {
        pressed.delete(event.code);
    };
    const onBlur = () => pressed.clear();
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('pointermove', onPointerMove);
    if (typeof window !== 'undefined') {
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        window.addEventListener('blur', onBlur);
    }
    app.ctx.loop.onFrame(({ delta }) => {
        camera.rotation.set(pitch, yaw, 0);
        const forward = Number(pressed.has('KeyW') || pressed.has('ArrowUp')) -
            Number(pressed.has('KeyS') || pressed.has('ArrowDown'));
        const strafe = Number(pressed.has('KeyD') || pressed.has('ArrowRight')) -
            Number(pressed.has('KeyA') || pressed.has('ArrowLeft'));
        if (!forward && !strafe)
            return;
        const step = speed * delta / Math.hypot(forward, strafe);
        scratchNext.copy(camera.position);
        scratchNext.x += (Math.sin(yaw) * -forward + Math.cos(yaw) * strafe) * step;
        scratchNext.z += (Math.cos(yaw) * -forward - Math.sin(yaw) * strafe) * step;
        scratchNext.y = (groundHeight?.(scratchNext.x, scratchNext.z) ?? 0) + eyeHeight;
        const resolved = collide ? collide(scratchNext, camera.position) : scratchNext;
        if (resolved)
            camera.position.copy(resolved);
    });
    return {
        app,
        orientation: () => ({ yaw, pitch }),
        dispose() {
            detachState();
            canvas.removeEventListener('pointerdown', onPointerDown);
            canvas.removeEventListener('pointerup', onPointerUp);
            canvas.removeEventListener('pointercancel', onPointerUp);
            canvas.removeEventListener('pointermove', onPointerMove);
            if (typeof window !== 'undefined') {
                window.removeEventListener('keydown', onKeyDown);
                window.removeEventListener('keyup', onKeyUp);
                window.removeEventListener('blur', onBlur);
            }
            if (isLocked())
                document.exitPointerLock?.();
            app.dispose();
        },
    };
}
// perf: cheap. one Set lookup pass + one vector write per frame; look input is
// event-driven.
//# sourceMappingURL=fps.js.map