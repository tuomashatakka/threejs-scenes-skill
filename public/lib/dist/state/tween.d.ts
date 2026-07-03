import type { Disposable, FrameContext } from '../types.js';
import type { StateController } from './controller.js';
export type Easing = (t: number) => number;
export declare const EASINGS: {
    linear: (t: number) => number;
    easeIn: (t: number) => number;
    easeOut: (t: number) => number;
    easeInOut: (t: number) => number;
    smoothstep: (t: number) => number;
};
/** Scalars and fixed-length numeric tuples — positions, scales, rgb colors. */
export type TweenValue = number | readonly number[];
export interface TweenOptions {
    /** Seconds per transition (timed mode). Default 0.4; 0 snaps. */
    duration?: number;
    easing?: Easing;
    /** When set, use continuous exp-damping toward the target instead of a timed tween. */
    stiffness?: number;
}
export interface Tweened<V extends TweenValue> extends Disposable {
    /** Current interpolated value. Tuples return the same array instance — copy to keep. */
    value(): V;
    target(): V;
    settled(): boolean;
    /** Advance the interpolation; call once per frame. */
    tick(ctx: FrameContext): void;
}
/**
 * Follow a numeric selection of controller state, easing every change.
 * `tweened(store, s => s.zoom)` re-targets itself whenever the store commits
 * a new zoom and `tick()` walks the value there over `duration` seconds.
 */
export declare function tweened<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, { duration, easing, stiffness }?: TweenOptions): Tweened<V>;
/**
 * Apply-on-animate: like {@link tweened}, but pushes each interpolated value
 * into `apply` while a transition is running (plus one final settled call).
 * The go-to for "lerp the camera/opacity/color when this state key changes".
 */
export declare function lerpOnChange<S extends object, V extends TweenValue>(source: StateController<S>, select: (state: S) => V, apply: (value: V) => void, options?: TweenOptions): Disposable & {
    tick(ctx: FrameContext): void;
};
//# sourceMappingURL=tween.d.ts.map