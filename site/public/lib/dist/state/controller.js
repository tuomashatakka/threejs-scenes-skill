// lib/state/controller.ts
// The controller protocol behind unidirectional data flow: anything with
// `get()` + `subscribe()` is accepted wherever a store is expected, and a
// plain object is wrapped so scaffolds can "receive an object, a state, or a
// controller" uniformly. `Store` from core/state satisfies StateController
// structurally — no adapter needed.
import { createStore } from '../core/state.js';
export function isStateController(source) {
    return !!source &&
        typeof source.get === 'function' &&
        typeof source.subscribe === 'function';
}
/**
 * Normalize any state source to a controller. Plain objects become a fresh
 * store seeded with the object, so downstream code has one code path.
 */
export function toController(source) {
    return isStateController(source) ? source : createStore(source);
}
/**
 * Mirror an external controller into an app: seed with `resolveInitialState`,
 * then keep the app state following the controller with `bindStateSource`.
 * Data flows controller -> app only; the returned function detaches.
 */
export function resolveInitialState(source, fallback) {
    if (!source)
        return fallback;
    return isStateController(source) ? source.get() : source;
}
export function bindStateSource(target, source) {
    if (!isStateController(source))
        return () => { };
    return source.subscribe(state => target.setState(state));
}
// perf: cheap. one Set-backed subscription per bound controller.
//# sourceMappingURL=controller.js.map