// lib/core/state.ts
// Minimal serializable store. The unidirectional contract: app state changes
// ONLY through set()/dispatch(); the frame loop reads state and writes scene
// objects, never the reverse. Keep state JSON-serializable (tuples, not
// Vector3s) so it can be persisted and replayed.
export function createStore(initial, reducer) {
    let state = initial;
    const listeners = new Set();
    function commit(next) {
        if (next === state)
            return;
        const prev = state;
        state = next;
        for (const listener of listeners)
            listener(state, prev);
    }
    return {
        get: () => state,
        set(patch) {
            commit({ ...state, ...patch });
        },
        dispatch(action) {
            if (!reducer)
                throw new Error('createStore.dispatch: store has no reducer');
            commit(reducer(state, action));
        },
        subscribe(listener) {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
}
// perf: cheap. one shallow copy per set(); reducers return new objects only
// when something changed.
//# sourceMappingURL=state.js.map