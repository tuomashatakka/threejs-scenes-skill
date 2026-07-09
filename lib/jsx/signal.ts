// lib/jsx/signal.ts
// Minimal reactivity for the JSX layer. A signal is a [getter, setter] pair;
// the getter is an Accessor (a zero-arg function). The reconciler treats any
// function-valued prop as reactive and re-reads it every frame — so reactivity
// is driven entirely by the render loop, with no separate scheduler or
// dependency graph to maintain. derived() composes accessors; effect() runs a
// callback whenever the loop re-evaluates (registered by the reconciler).

/**
 * A zero-argument getter for a reactive value.
 *
 * @remarks
 * Passing an accessor as a JSX prop marks the prop reactive: the render loop
 * re-reads it every frame and re-applies the result to the mounted object.
 *
 * @typeParam T - Value type produced by the read.
 */
export type Accessor<T> = () => T

/**
 * Writes a signal's value; takes the next value or an updater `prev => next`.
 *
 * @remarks
 * Synchronous and schedules nothing — the new value is simply observed the
 * next time the frame loop polls the paired accessor.
 *
 * @typeParam T - Value type stored.
 */
export type Setter<T> = (next: T | ((prev: T) => T)) => void

/**
 * Create a reactive value as an `[Accessor, Setter]` pair.
 *
 * @remarks
 * There are no subscriptions and no dependency tracking: `set` stores the
 * value, and anything reading through `get` — reactive JSX props, frame
 * callbacks — sees it on the next frame poll.
 *
 * @typeParam T - Stored value type.
 * @param initial - Starting value.
 * @returns `[get, set]`; pass `get` (or a closure over it) as a JSX prop to
 * drive that prop every frame.
 */
export function signal<T> (initial: T): [Accessor<T>, Setter<T>] {
  let value = initial
  const get: Accessor<T> = () => value
  const set: Setter<T>   = next => {
    value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next
  }
  return [ get, set ]
}

/** A derived accessor — just a memo-free computed read, re-run when polled. */
export function derived<T> (fn: Accessor<T>): Accessor<T> {
  return fn
}

/** Marker so the reconciler can distinguish accessors from plain values. */
export function isAccessor (value: unknown): value is Accessor<unknown> {
  return typeof value === 'function'
}

// perf: O(1) per read. With the loop-driven model the cost is one function call
// per reactive prop per frame — keep heavy computation out of accessors.
