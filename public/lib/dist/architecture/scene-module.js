// lib/architecture/scene-module.ts
// Context-injection scene module helper. Every scene feature is a factory
// returning { name, build(ctx), dispose() }. Modules never reach for globals —
// they receive a SceneContext, register animated work via loop.registerUpdate
// in build(), and unregister + free only what they own in dispose()
// (production-lessons.md architecture section).
export function createSceneModule(def) {
    const updates = [];
    let ctxRef = null;
    let teardown;
    return {
        name: def.name,
        build(ctx) {
            ctxRef = ctx;
            const register = (cb) => {
                updates.push(cb);
                ctx.loop.registerUpdate(cb);
            };
            teardown = def.build(ctx, register);
        },
        dispose() {
            // unregister every frame callback this module added.
            if (ctxRef)
                for (const cb of updates)
                    ctxRef.loop.unregisterUpdate(cb);
            updates.length = 0;
            teardown?.();
            ctxRef = null;
        },
    };
}
//# sourceMappingURL=scene-module.js.map