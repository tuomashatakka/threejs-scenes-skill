// lib/architecture/material-pool.ts
// MaterialPool — caches materials by key; the pool OWNS disposal. Modules call
// get(key, factory) and reuse shared materials; they never dispose a pooled
// material themselves (disposing a shared MeshStandardMaterial nukes every mesh
// referencing it — the #1 disposal footgun in production-lessons.md).

import type * as THREE from 'three'

import type { Disposable } from '../types.js'


export class MaterialPool implements Disposable {
  private readonly cache = new Map<string, THREE.Material>()

  get<T extends THREE.Material> (key: string, factory: () => T): T {
    const existing = this.cache.get(key)
    if (existing)
      return existing as T

    const created = factory()
    this.cache.set(key, created)
    return created
  }

  has (key: string): boolean {
    return this.cache.has(key)
  }

  get size (): number {
    return this.cache.size
  }

  // the pool owns disposal of everything it cached.
  dispose (): void {
    for (const mat of this.cache.values())
      mat.dispose()
    this.cache.clear()
  }
}

// perf: cheap. one Map lookup per get. Shared materials pool cleanly.
