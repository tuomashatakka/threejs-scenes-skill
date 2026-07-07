export type ClockMode = 'wall' | 'fixed';
export interface ClockOptions {
    mode?: ClockMode;
    /** Fixed step size in seconds. Only used in 'fixed' mode. */
    step?: number;
    /** Max fixed steps consumed per advance() call. Overflow time is dropped. */
    maxSubSteps?: number;
}
/**
 * A simulation time source. Feed it real elapsed seconds via `advance` and run
 * one simulation tick per returned delta. In 'fixed' mode the returned deltas
 * are always exactly `step`, so tick count — not wall time — drives the sim.
 */
export interface Clock {
    readonly mode: ClockMode;
    advance(realDelta: number): readonly number[];
    /** Total simulated seconds consumed so far. */
    elapsed(): number;
    reset(): void;
}
export declare function createClock({ mode, step, maxSubSteps }?: ClockOptions): Clock;
//# sourceMappingURL=clock.d.ts.map