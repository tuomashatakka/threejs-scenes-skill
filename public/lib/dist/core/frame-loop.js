// lib/core/frame-loop.ts
// Self-contained Clock-driven frame loop. Single source of truth: every
// animated subsystem registers through onFrame() and receives a shared
// { delta, elapsed, frame }. Ported from scripts/frame-loop.js but with the
// external @tuomashatakka/canvas-loop-framecapper dependency removed — the loop
// is inlined the same way the templates inline it, so the package has no exotic
// deps. registerUpdate/unregisterUpdate mirror the SceneModule lifecycle API.
import * as THREE from 'three';
export function createFrameLoop({ clock: simClock } = {}) {
    const subscribers = new Set();
    const clock = new THREE.Clock(false);
    let frame = 0;
    let rafId = 0;
    let running = false;
    function tick() {
        if (!running)
            return;
        rafId = requestAnimationFrame(tick);
        const real = clock.getDelta();
        // perf: one rAF, one Set iteration per sim step. zero allocations.
        if (simClock) {
            for (const delta of simClock.advance(real)) {
                frame += 1;
                const elapsed = simClock.elapsed();
                for (const cb of subscribers)
                    cb({ delta, elapsed, frame });
            }
            return;
        }
        frame += 1;
        const elapsed = clock.getElapsedTime();
        for (const cb of subscribers)
            cb({ delta: real, elapsed, frame });
    }
    function start() {
        if (running)
            return;
        running = true;
        clock.start();
        rafId = requestAnimationFrame(tick);
    }
    function stop() {
        if (!running)
            return;
        running = false;
        clock.stop();
        cancelAnimationFrame(rafId);
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
    }
    return { onFrame, registerUpdate, unregisterUpdate, start, stop, dispose };
}
//# sourceMappingURL=frame-loop.js.map