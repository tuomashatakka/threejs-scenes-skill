import type { App, AppOptions } from '../core/app.js';
import type { PathCamera, PathCameraOptions } from '../camera/path-camera.js';
import type { SegmentStream, SegmentStreamOptions, StreamSegmentInput } from '../procedural/segment-stream.js';
import type { StateSource } from '../state/controller.js';
import type { SeededRng, Disposable } from '../types.js';
export interface RailsScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'orbit' | 'state'>, SegmentStreamOptions, PathCameraOptions {
    state?: StateSource<S>;
    /** Build segment #index. Runs ahead of the camera; keep it deterministic via rng. */
    segment: (index: number, rng: SeededRng) => StreamSegmentInput;
    /** Append the next segment when less than this path length remains. Default 40. */
    prefetchDistance?: number;
}
export interface RailsScaffold<S extends object> extends Disposable {
    app: App<S>;
    stream: SegmentStream;
    rig: PathCamera;
}
export declare function createRailsScaffold<S extends object = Record<string, unknown>>({ state, segment, prefetchDistance, maxActive, lift, tension, yawRange, pitchRange, smoothing, speed, ...appOptions }: RailsScaffoldOptions<S>): RailsScaffold<S>;
//# sourceMappingURL=rails.d.ts.map