// lib/core/state.ts
// Minimal serializable store. The unidirectional contract: app state changes
// ONLY through set()/dispatch(); the frame loop reads state and writes scene
// objects, never the reverse. Keep state JSON-serializable (tuples, not
// Vector3s) so it can be persisted and replayed.

export type Reducer<S, A> = (state: S, action: A) => S

export type StoreListener<S> = (state: S, prev: S) => void

export interface Store<S, A = Partial<S>> {
  get (): S

  /** Shallow-merge a patch into the state and notify subscribers. */
  set (patch: Partial<S>): void

  /** Run the reducer. Throws when the store was created without one. */
  dispatch (action: A): void
  subscribe (listener: StoreListener<S>): () => void
}

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
