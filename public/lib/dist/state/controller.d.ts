/** Read side of a store: the minimal contract scaffolds consume state through. */
export interface StateController<S extends object> {
    get(): S;
    subscribe(listener: (state: S, prev: S) => void): () => void;
}
/** What a scaffold accepts as its state input. */
export type StateSource<S extends object> = S | StateController<S>;
export declare function isStateController<S extends object>(source: StateSource<S> | undefined): source is StateController<S>;
/**
 * Normalize any state source to a controller. Plain objects become a fresh
 * store seeded with the object, so downstream code has one code path.
 */
export declare function toController<S extends object>(source: StateSource<S>): StateController<S>;
/**
 * Mirror an external controller into an app: seed with `resolveInitialState`,
 * then keep the app state following the controller with `bindStateSource`.
 * Data flows controller -> app only; the returned function detaches.
 */
export declare function resolveInitialState<S extends object>(source: StateSource<S> | undefined, fallback: S): S;
export declare function bindStateSource<S extends object>(target: {
    setState(patch: Partial<S>): void;
}, source: StateSource<S> | undefined): () => void;
//# sourceMappingURL=controller.d.ts.map