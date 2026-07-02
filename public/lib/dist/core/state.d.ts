export type Reducer<S, A> = (state: S, action: A) => S;
export type StoreListener<S> = (state: S, prev: S) => void;
export interface Store<S, A = Partial<S>> {
    get(): S;
    /** Shallow-merge a patch into the state and notify subscribers. */
    set(patch: Partial<S>): void;
    /** Run the reducer. Throws when the store was created without one. */
    dispatch(action: A): void;
    subscribe(listener: StoreListener<S>): () => void;
}
export declare function createStore<S extends object, A = Partial<S>>(initial: S, reducer?: Reducer<S, A>): Store<S, A>;
//# sourceMappingURL=state.d.ts.map