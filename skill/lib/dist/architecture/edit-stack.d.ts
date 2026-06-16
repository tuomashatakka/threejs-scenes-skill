export declare class EditStack<T> {
    private readonly past;
    private readonly future;
    private current;
    constructor(initial: T);
    get value(): T;
    get canUndo(): boolean;
    get canRedo(): boolean;
    apply(next: T): void;
    undo(): T;
    redo(): T;
}
//# sourceMappingURL=edit-stack.d.ts.map