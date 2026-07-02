// lib/core/frame-loop.ts
// Frame loop backed by @tuomashatakka/canvas-loop-framecapper. Every animated
// subsystem registers through onFrame() and receives a shared
// { delta, elapsed, frame }. The framecapper's shared FrameLoopManager owns the
// single requestAnimationFrame and (optionally) caps it to a fixed frame rate
// with a fixed-timestep accumulator; each createFrameLoop() keeps its own
// subscriber set, frame counter and elapsed time, so independent loops can
// start/stop without affecting one another. registerUpdate/unregisterUpdate
// mirror the SceneModule lifecycle API.
import { frameLoopManager } from '@tuomashatakka/canvas-loop-framecapper';
export function createFrameLoop({ clock: simClock, fps } = {}) {
    const subscribers = new Set();
    let frame = 0;
    let elapsed = 0;
    let running = false;
    if (fps !== undefined)
        frameLoopManager.setFixedFrameRate(fps);
    // One sync callback on the shared manager per loop. The manager hands us the
    // real (or fixed-step, when capped) delta in seconds; sub-stepping through an
    // injected sim clock happens here, exactly as before.
    function pump() {
        const real = frameLoopManager.deltaTime;
        // perf: one shared rAF, one Set iteration per sim step. zero allocations.
        if (simClock) {
            for (const delta of simClock.advance(real)) {
                frame += 1;
                const simElapsed = simClock.elapsed();
                for (const cb of subscribers)
                    cb({ delta, elapsed: simElapsed, frame });
            }
            return;
        }
        frame += 1;
        elapsed += real;
        for (const cb of subscribers)
            cb({ delta: real, elapsed, frame });
    }
    function start() {
        if (running)
            return;
        running = true;
        frameLoopManager.registerSyncCallback(pump);
        frameLoopManager.resume();
    }
    function stop() {
        if (!running)
            return;
        running = false;
        // Unregister only — pausing the shared manager would freeze sibling loops.
        frameLoopManager.unregisterSyncCallback(pump);
    }
    function onFrame(cb) {
        subscribers.add(cb);
        if (!running)
            start();
        return () => {
            subscribers.delete(cb);
        };
    }
    function registerUpdate(cb) {
        return onFrame(cb);
    }
    function unregisterUpdate(cb) {
        subscribers.delete(cb);
    }
    function dispose() {
        stop();
        subscribers.clear();
        frame = 0;
        elapsed = 0;
    }
    return { onFrame, registerUpdate, unregisterUpdate, start, stop, dispose };
}
//# sourceMappingURL=frame-loop.js.map