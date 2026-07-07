// lib/core/scene-bootstrap.ts
// Minimal scene bootstrap, refactored to delegate directly to createApp.
// Wires renderer + scene + camera + frame loop + pointer gesture +
// resize observer + dispose path.
import { createApp } from './app.js';
export function bootstrapScene({ canvas, onSetup }) {
    if (!canvas)
        throw new Error('canvas required');
    let userTick = null;
    const app = createApp({
        canvas,
        orbit: true,
        lighting: true,
        onFrame: (_state, frameCtx, _sceneCtx) => {
            if (userTick)
                userTick(frameCtx);
        }
    });
    const { scene, camera, renderer, loop } = app.ctx;
    if (onSetup) {
        const tick = onSetup({
            scene,
            camera: camera,
            renderer,
            loop
        });
        if (tick)
            userTick = tick;
    }
    app.start();
    return {
        renderer,
        scene,
        camera: camera,
        loop,
        dispose() {
            app.stop();
            app.dispose();
        }
    };
}
//# sourceMappingURL=scene-bootstrap.js.map