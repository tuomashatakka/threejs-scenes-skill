import type { Clock } from './clock.js';
import type { FrameLoop } from '../types.js';
export interface FrameLoopOptions {
    /** Injectable sim-time source (createClock). Default: raw wall-clock deltas. */
    clock?: Clock;
}
export declare function createFrameLoop({ clock: simClock }?: FrameLoopOptions): FrameLoop;
//# sourceMappingURL=frame-loop.d.ts.map