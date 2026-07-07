// lib/state/tween.ts
// Transition helpers for unidirectional state: numeric (or numeric-tuple)
// values selected from a controller are interpolated over frames instead of
// snapping when the state changes. Two modes: timed tween (duration + easing)
// and exp-damped chase (stiffness) — the same 1 - exp(-k·delta) damping the
// follow camera uses, framerate-independent by construction.

import type { Disposable, FrameContext } from '../types.js'
import type { StateController } from './controller.js'


export type Easing = (t: number) => number

export const EASINGS = {
  linear:     (t: number): number => t,
  easeIn:     (t: number): number => t * t,
  easeOut:    (t: number): number => t * (2 - t),
  easeInOut:  (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  smoothstep: (t: number): number => t * t * (3 - 2 * t),
} satisfies Record<string, Easing>

/** Scalars and fixed-length numeric tuples — positions, scales, rgb colors. */
export type TweenValue = number | readonly number[]

export interface TweenOptions {

  /** Seconds per transition (timed mode). Default 0.4; 0 snaps. */
  duration?: number
  easing?:   Easing

  /** When set, use continuous exp-damping toward the target instead of a timed tween. */
  stiffness?: number
}

export interface Tweened<V extends TweenValue> extends Disposable {

  /** Current interpolated value. Tuples return the same array instance — copy to keep. */
  value (): V
  target (): V
  settled (): boolean

  /** Advance the interpolation; call once per frame. */
  tick (ctx: FrameContext): void
}

const EPSILON = 1e-4

/**
 * Follow a numeric selection of controller state, easing every change.
 * `tweened(store, s => s.zoom)` re-targets itself whenever the store commits
 * a new zoom and `tick()` walks the value there over `duration` seconds.
 */
export function tweened<S extends object, V extends TweenValue> (
  source: StateController<S>,
  select: (state: S) => V,
  { duration = 0.4, easing = EASINGS.easeInOut, stiffness }: TweenOptions = {},
): Tweened<V> {
  const initial  = select(source.get())
  const isScalar = typeof initial === 'number'
  const toArray  = (v: V): number[] => isScalar ? [ v as number ] : [ ...v as readonly number[] ]

  let from = toArray(initial)
  let to   = toArray(initial)
  const now   = toArray(initial)
  let t       = 1
  let resting = true

  const unsubscribe = source.subscribe(state => {
    const next = toArray(select(state))
    if (next.length === to.length && next.every((v, i) => v === to[i]))
      return
    from    = now.slice()
    to      = next
    t       = 0
    resting = false
  })

  function tick ({ delta }: FrameContext): void {
    if (resting)
      return
    if (stiffness !== undefined) {
      const k     = 1 - Math.exp(-stiffness * delta)
      let maxDiff = 0
      for (let i = 0; i < now.length; i++) {
        now[i] += (to[i]! - now[i]!) * k
        maxDiff = Math.max(maxDiff, Math.abs(to[i]! - now[i]!))
      }
      if (maxDiff < EPSILON) {
        for (let i = 0; i < now.length; i++)
          now[i] = to[i]!
        resting = true
      }
      return
    }
    t = duration <= 0 ? 1 : Math.min(1, t + delta / duration)

    const k = easing(t)
    for (let i = 0; i < now.length; i++)
      now[i] = from[i]! + (to[i]! - from[i]!) * k
    if (t >= 1)
      resting = true
  }

  return {
    value:   () => isScalar ? now[0] as V : now as unknown as V,
    target:  () => isScalar ? to[0] as V : to as unknown as V,
    settled: () => resting,
    tick,
    dispose: unsubscribe,
  }
}

/**
 * Apply-on-animate: like {@link tweened}, but pushes each interpolated value
 * into `apply` while a transition is running (plus one final settled call).
 * The go-to for "lerp the camera/opacity/color when this state key changes".
 */
export function lerpOnChange<S extends object, V extends TweenValue> (
  source: StateController<S>,
  select: (state: S) => V,
  apply: (value: V) => void,
  options?: TweenOptions,
): Disposable & { tick (ctx: FrameContext): void } {
  const tw       = tweened(source, select, options)
  let wasSettled = true
  apply(tw.value())
  return {
    tick (ctx) {
      const already = tw.settled() && wasSettled
      tw.tick(ctx)
      if (!already)
        apply(tw.value())
      wasSettled = tw.settled()
    },
    dispose: () => tw.dispose(),
  }
}

// perf: cheap. fixed-size number arrays, zero per-frame allocation.
