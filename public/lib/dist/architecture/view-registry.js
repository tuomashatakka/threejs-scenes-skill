// lib/architecture/view-registry.ts
// Pluggable per-view renderers with an LRU persistent-mount cache: switching
// views deactivates (but keeps) the previous renderer so switching back is
// instant; least-recently-used renderers beyond `limit` are disposed. The
// IViewRenderer seam from stellar-cartogrph, generalized.
export function createViewRegistry({ create, limit = 4 }) {
    // Map iteration order = insertion order; re-inserting on use makes it an LRU.
    const cache = new Map();
    let currentKey = null;
    function activate(key, ctx) {
        if (currentKey === key) {
            const current = cache.get(key);
            if (current)
                return current;
        }
        const previous = currentKey ? cache.get(currentKey) : undefined;
        previous?.setActive?.(false);
        let renderer = cache.get(key);
        if (renderer)
            cache.delete(key);
        else
            renderer = create(key, ctx);
        cache.set(key, renderer);
        currentKey = key;
        renderer.setActive?.(true);
        // evict least-recently-used beyond limit (never the active one)
        while (cache.size > limit) {
            const [oldestKey, oldest] = cache.entries().next().value;
            if (oldestKey === currentKey)
                break;
            cache.delete(oldestKey);
            oldest.dispose();
        }
        return renderer;
    }
    return {
        activate,
        active: () => currentKey ? cache.get(currentKey) ?? null : null,
        activeKey: () => currentKey,
        get: key => cache.get(key),
        update(frame) {
            if (currentKey)
                cache.get(currentKey)?.update?.(frame);
        },
        updateState(state) {
            if (currentKey)
                cache.get(currentKey)?.updateState?.(state);
        },
        dispose() {
            for (const renderer of cache.values())
                renderer.dispose();
            cache.clear();
            currentKey = null;
        },
    };
}
// perf: cheap. the cache trades GPU memory (kept sub-scenes) for instant
// view switches; tune `limit` against your heaviest views.
//# sourceMappingURL=view-registry.js.map