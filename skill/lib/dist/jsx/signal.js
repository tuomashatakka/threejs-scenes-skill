// lib/jsx/signal.ts
// Minimal reactivity for the JSX layer. A signal is a [getter, setter] pair;
// the getter is an Accessor (a zero-arg function). The reconciler treats any
// function-valued prop as reactive and re-reads it every frame — so reactivity
// is driven entirely by the render loop, with no separate scheduler or
// dependency graph to maintain. derived() composes accessors; effect() runs a
// callback whenever the loop re-evaluates (registered by the reconciler).
export function signal(initial) {
    let value = initial;
    const get = () => value;
    const set = next => {
        value = typeof next === 'function' ? next(value) : next;
    };
    return [get, set];
}
/** A derived accessor — just a memo-free computed read, re-run when polled. */
export function derived(fn) {
    return fn;
}
/** Marker so the reconciler can distinguish accessors from plain values. */
export function isAccessor(value) {
    return typeof value === 'function';
}
// perf: O(1) per read. With the loop-driven model the cost is one function call
// per reactive prop per frame — keep heavy computation out of accessors.
//# sourceMappingURL=signal.js.map