// lib/core/state.ts
// Minimal serializable store. The unidirectional contract: app state changes
// ONLY through set()/dispatch(); the frame loop reads state and writes scene
// objects, never the reverse. Keep state JSON-serializable (tuples, not
// Vector3s) so it can be persisted and replayed.

/** Pure state transition: returns the next state for an action, never mutates. */
export type Reducer<S, A> = (state: S, action: A) => S

/** Change subscriber invoked with the new state and the state it replaced. */
export type StoreListener<S> = (state: S, prev: S) => void

/**
 * Minimal serializable store — the single writer of app state. The frame loop
 * reads state and writes scene objects, never the reverse.
 */
export interface Store<S, A = Partial<S>> {
  get (): S

  /** Shallow-merge a patch into the state and notify subscribers. */
  set (patch: Partial<S>): void

  /** Run the reducer. Throws when the store was created without one. */
  dispatch (action: A): void

  /** Listen for state changes; returns an unsubscribe function. */
  subscribe (listener: StoreListener<S>): () => void
}

/**
 * Create a minimal store holding serializable app state. `set` shallow-merges
 * a patch; `dispatch` runs the optional reducer; listeners fire only when the
 * committed state is a new object reference (reducers may return the same
 * state to signal no change).
 *
 * @param initial - Starting state. Keep it JSON-serializable (tuples, not
 * `Vector3`s) so it can be persisted and replayed.
 * @param reducer - Optional {@link Reducer} enabling `dispatch`; without one,
 * `dispatch` throws.
 * @returns A {@link Store}.
 */
export function createStore<S extends object, A = Partial<S>> (
  initial: S,
  reducer?: Reducer<S, A>,
): Store<S, A> {
  let state       = initial
  const listeners = new Set<StoreListener<S>>()

  function commit (next: S): void {
    if (next === state)
      return

    const prev = state
    state = next
    for (const listener of listeners)
      listener(state, prev)
  }

  return {
    get: () => state,
    set (patch) {
      commit({ ...state, ...patch })
    },
    dispatch (action) {
      if (!reducer)
        throw new Error('createStore.dispatch: store has no reducer')
      commit(reducer(state, action))
    },
    subscribe (listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

// perf: cheap. one shallow copy per set(); reducers return new objects only
// when something changed.
