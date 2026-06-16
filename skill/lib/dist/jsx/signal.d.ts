export type Accessor<T> = () => T;
export type Setter<T> = (next: T | ((prev: T) => T)) => void;
export declare function signal<T>(initial: T): [Accessor<T>, Setter<T>];
/** A derived accessor — just a memo-free computed read, re-run when polled. */
export declare function derived<T>(fn: Accessor<T>): Accessor<T>;
/** Marker so the reconciler can distinguish accessors from plain values. */
export declare function isAccessor(value: unknown): value is Accessor<unknown>;
//# sourceMappingURL=signal.d.ts.map