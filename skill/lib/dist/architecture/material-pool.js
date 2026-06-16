// lib/architecture/material-pool.ts
// MaterialPool — caches materials by key; the pool OWNS disposal. Modules call
// get(key, factory) and reuse shared materials; they never dispose a pooled
// material themselves (disposing a shared MeshStandardMaterial nukes every mesh
// referencing it — the #1 disposal footgun in production-lessons.md).
export class MaterialPool {
    cache = new Map();
    get(key, factory) {
        const existing = this.cache.get(key);
        if (existing)
            return existing;
        const created = factory();
        this.cache.set(key, created);
        return created;
    }
    has(key) {
        return this.cache.has(key);
    }
    get size() {
        return this.cache.size;
    }
    // the pool owns disposal of everything it cached.
    dispose() {
        for (const mat of this.cache.values())
            mat.dispose();
        this.cache.clear();
    }
}
// perf: cheap. one Map lookup per get. Shared materials pool cleanly.
//# sourceMappingURL=material-pool.js.map