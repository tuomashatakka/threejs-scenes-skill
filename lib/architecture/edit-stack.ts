// lib/architecture/edit-stack.ts
// Snapshot-based undo/redo. Before applying generated/user edits, push a
// snapshot; on failure, restore atomically so no broken partial state escapes
// (the snapshot/restore transaction lesson in production-lessons.md).

/**
 * Snapshot-based undo/redo stack. `push` records a new state and clears the
 * redo branch; `undo`/`redo` move the cursor and return the restored value.
 *
 * @typeParam T - The snapshot type; store immutable snapshots (or clones),
 * never live references that later mutate.
 * @example
 * const edits = new EditStack(initialLayout)
 * edits.push(nextLayout)
 * const restored = edits.undo()
 */
export class EditStack<T> {
  private readonly past:   T[] = []
  private readonly future: T[] = []
  private current:         T

  constructor (initial: T) {
    this.current = initial
  }

  get value (): T {
    return this.current
  }

  get canUndo (): boolean {
    return this.past.length > 0
  }

  get canRedo (): boolean {
    return this.future.length > 0
  }

  // snapshot the current state, then advance to the next.
  apply (next: T): void {
    this.past.push(this.current)
    this.current       = next
    this.future.length = 0
  }

  undo (): T {
    const prev = this.past.pop()
    if (prev === undefined)
      return this.current
    this.future.push(this.current)
    this.current = prev
    return this.current
  }

  redo (): T {
    const next = this.future.pop()
    if (next === undefined)
      return this.current
    this.past.push(this.current)
    this.current = next
    return this.current
  }
}

// perf: cheap. two arrays as stacks; snapshots are caller-supplied values.
