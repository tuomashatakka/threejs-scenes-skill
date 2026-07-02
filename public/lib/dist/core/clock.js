// lib/core/clock.ts
// Injectable time source for the frame loop and createApp. 'wall' passes real
// frame deltas through untouched; 'fixed' runs a fixed-timestep accumulator so
// the same tick sequence always produces the same simulation — the determinism
// backbone for replays and headless tests (production-lessons.md: same seed +
// same steps -> same world).
export function createClock({ mode = 'wall', step = 1 / 60, maxSubSteps = 5 } = {}) {
    let accumulator = 0;
    let total = 0;
    const out = [];
    function advance(realDelta) {
        out.length = 0;
        if (mode === 'wall') {
            total += realDelta;
            out.push(realDelta);
            return out;
        }
        // fixed: accumulate real time, emit whole steps. When more than
        // maxSubSteps worth of time has piled up (tab was hidden, GC pause), the
        // remainder is DROPPED rather than replayed — the sim slows instead of
        // entering a catch-up death spiral.
        accumulator += realDelta;
        while (accumulator >= step && out.length < maxSubSteps) {
            accumulator -= step;
            total += step;
            out.push(step);
        }
        if (out.length >= maxSubSteps)
            accumulator = 0;
        return out;
    }
    return {
        mode,
        advance,
        elapsed: () => total,
        reset() {
            accumulator = 0;
            total = 0;
        },
    };
}
// perf: cheap. one reused array, zero allocation per frame.
//# sourceMappingURL=clock.js.map