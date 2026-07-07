import type { Clock } from './clock.js';
import type { FrameLoop } from '../types.js';
export interface FrameLoopOptions {
    /** Injectable sim-time source (createClock). Default: raw wall-clock deltas. */
    clock?: Clock;
    /**
     * Cap the loop at a fixed frame rate (fps > 0). Applies a fixed-timestep
     * accumulator: capped frames always receive delta = 1/fps. NOTE: the cap is
     * set on the shared FrameLoopManager, so it applies to every loop on the page.
     */
    fps?: number;
}
export declare function createFrameLoop({ clock: simClock, fps }?: FrameLoopOptions): FrameLoop;
//# sourceMappingURL=frame-loop.d.ts.map