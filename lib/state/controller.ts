// lib/state/controller.ts
// The controller protocol behind unidirectional data flow: anything with
// `get()` + `subscribe()` is accepted wherever a store is expected, and a
// plain object is wrapped so scaffolds can "receive an object, a state, or a
// controller" uniformly. `Store` from core/state satisfies StateController
// structurally — no adapter needed.

import { createStore } from '../core/state.js'


/** Read side of a store: the minimal contract scaffolds consume state through. */
export interface StateController<S extends object> {
  get (): S
  subscribe (listener: (state: S, prev: S) => void): () => void
}

/** What a scaffold accepts as its state input. */
export type StateSource<S extends object> = S | StateController<S>

export function isStateController<S extends object> (
  source: StateSource<S> | undefined,
): source is StateController<S> {
  return !!source &&
    typeof (source as StateController<S>).get === 'function' &&
    typeof (source as StateController<S>).subscribe === 'function'
}

/**
 * Normalize any state source to a controller. Plain objects become a fresh
 * store seeded with the object, so downstream code has one code path.
 */
export function toController<S extends object> (source: StateSource<S>): StateController<S> {
  return isStateController(source) ? source : createStore(source)
}

/**
 * Mirror an external controller into an app: seed with `resolveInitialState`,
 * then keep the app state following the controller with `bindStateSource`.
 * Data flows controller -> app only; the returned function detaches.
 */
export function resolveInitialState<S extends object> (source: StateSource<S> | undefined, fallback: S): S {
  if (!source)
    return fallback
  return isStateController(source) ? source.get() : source
}

export function bindStateSource<S extends object> (
  target: { setState (patch: Partial<S>): void },
  source: StateSource<S> | undefined,
): () => void {
  if (!isStateController(source))
    return () => {}
  return source.subscribe(state => target.setState(state))
}

// perf: cheap. one Set-backed subscription per bound controller.
