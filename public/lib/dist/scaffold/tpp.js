// lib/scaffold/tpp.ts
// Third-person scaffold: createApp with the built-in orbit disabled and a
// framerate-independent follow camera chasing a target. Swap what is being
// chased at runtime with setTarget — drive the target's transform from your
// modules (state -> target -> camera, one direction).
import * as THREE from 'three';
import { createApp } from '../core/app.js';
import { createFollowCamera } from '../camera/follow-camera.js';
import { resolveInitialState, bindStateSource } from '../state/controller.js';
export function createTppScaffold({ state, target = undefined, offset = [0, 3, -6], lookAhead = [0, 1, 4], stiffness, rotationStiffness, ...appOptions }) {
    const app = createApp({
        ...appOptions,
        state: resolveInitialState(state, {}),
        orbit: false,
    });
    const detachState = bindStateSource(app, state);
    let follow = null;
    function setTarget(next) {
        follow = next
            ? createFollowCamera(app.ctx.camera, next, {
                offset: new THREE.Vector3(...offset),
                lookAhead: new THREE.Vector3(...lookAhead),
                ...stiffness !== undefined ? { stiffness } : {},
                ...rotationStiffness !== undefined ? { rotationStiffness } : {},
            })
            : null;
    }
    if (target)
        setTarget(target);
    app.ctx.loop.onFrame(ctx => follow?.(ctx));
    return {
        app,
        setTarget,
        dispose() {
            detachState();
            follow = null;
            app.dispose();
        },
    };
}
// perf: cheap. the follow camera is three scratch vectors per frame,
// zero allocation.
//# sourceMappingURL=tpp.js.map