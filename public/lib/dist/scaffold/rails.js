// lib/scaffold/rails.ts
// On-rails scaffold: an endless segment stream stitched into one curve and a
// path camera travelling it with pointer look-around. You supply a segment
// factory (seeded rng in hand); the scaffold appends segments ahead of the
// camera and evicts them behind it — constant memory, infinite ride.
import { createApp } from '../core/app.js';
import { createPathCamera } from '../camera/path-camera.js';
import { createSegmentStream } from '../procedural/segment-stream.js';
import { resolveInitialState, bindStateSource } from '../state/controller.js';
export function createRailsScaffold({ state, segment, prefetchDistance = 40, maxActive, lift, tension, yawRange, pitchRange, smoothing, speed, ...appOptions }) {
    const app = createApp({
        ...appOptions,
        state: resolveInitialState(state, {}),
        orbit: false,
    });
    const detachState = bindStateSource(app, state);
    const stream = createSegmentStream(app.ctx.scene, { maxActive, lift, tension });
    const rig = createPathCamera(app.ctx.camera, stream, appOptions.canvas, { yawRange, pitchRange, smoothing, speed });
    const segmentRng = app.ctx.rng.fork('rails-segments');
    function prefetch() {
        // safety cap: a degenerate zero-length segment must not spin forever
        for (let guard = 0; guard < 16 && stream.total - rig.distance < prefetchDistance; guard++)
            stream.append(segment(stream.appended, segmentRng));
    }
    prefetch();
    app.ctx.loop.onFrame(ctx => {
        rig.update(ctx);
        prefetch();
    });
    return {
        app,
        stream,
        rig,
        dispose() {
            detachState();
            rig.dispose();
            stream.dispose();
            app.dispose();
        },
    };
}
// perf: cheap per frame (two curve samples + a length check); segment builds
// amortize over the ride and evicted segments dispose their own GPU memory.
//# sourceMappingURL=rails.js.map