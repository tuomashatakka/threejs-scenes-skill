// lib/scaffold/orbit.ts
// Product/model-viewer scaffold: createApp with the built-in pointer orbit,
// standard lighting, an auto-rotating stage group for content, and a
// fit-to-object framing helper. Put viewer content on `stage` so the
// turntable spins the model, not the lights.
import * as THREE from 'three';
import { createApp } from '../core/app.js';
import { resolveInitialState, bindStateSource } from '../state/controller.js';
const scratchBox = new THREE.Box3();
const scratchSphere = new THREE.Sphere();
export function createOrbitScaffold({ state, autoRotate = 0, ...appOptions }) {
    const app = createApp({
        ...appOptions,
        state: resolveInitialState(state, {}),
    });
    const detachState = bindStateSource(app, state);
    const stage = new THREE.Group();
    stage.name = 'orbit-stage';
    app.ctx.scene.add(stage);
    if (autoRotate !== 0)
        app.ctx.loop.onFrame(({ delta }) => {
            stage.rotation.y += autoRotate * delta;
        });
    return {
        app,
        stage,
        fitTo(object, margin = 1.25) {
            scratchBox.setFromObject(object);
            scratchBox.getBoundingSphere(scratchSphere);
            const camera = app.ctx.camera;
            const fov = camera.isPerspectiveCamera
                ? THREE.MathUtils.degToRad(camera.fov)
                : Math.PI / 4;
            const distance = scratchSphere.radius * margin / Math.sin(fov / 2);
            const direction = camera.position.clone().sub(scratchSphere.center);
            if (direction.lengthSq() < 1e-6)
                direction.set(1, 0.6, 1);
            camera.position
                .copy(scratchSphere.center)
                .addScaledVector(direction.normalize(), distance);
            camera.lookAt(scratchSphere.center);
        },
        dispose() {
            detachState();
            app.ctx.scene.remove(stage);
            app.dispose();
        },
    };
}
// perf: cheap. the turntable is one rotation write per frame; fitTo is
// event-time only (Box3 traversal of the framed object).
//# sourceMappingURL=orbit.js.map