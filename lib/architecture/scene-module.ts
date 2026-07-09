// lib/architecture/scene-module.ts
// Context-injection scene module helper. Every scene feature is a factory
// returning { name, build(ctx), dispose() }. Modules never reach for globals —
// they receive a SceneContext, register animated work via loop.registerUpdate
// in build(), and unregister + free only what they own in dispose()
// (production-lessons.md architecture section).

import type { FrameCallback, SceneContext, SceneModule } from '../types.js'


/** Definition consumed by {@link createSceneModule}: a `name` plus `build(ctx, registerUpdate)` which may return a teardown function. */
export interface SceneModuleDefinition {
  name: string
  build (ctx: SceneContext, registerUpdate: (cb: FrameCallback) => void): void | (() => void)
}

/**
 * Wrap a build function into a lifecycle-safe `SceneModule`. Updates
 * registered through the injected `registerUpdate` are tracked and
 * automatically unregistered on `dispose()`, along with the optional teardown
 * returned by `build`.
 *
 * @param def - Module name and build function.
 * @returns A `SceneModule` whose `dispose()` frees only what the module
 * created — never shared or pooled resources.
 * @example
 * const stars = createSceneModule({
 *   name: 'stars',
 *   build (ctx, registerUpdate) {
 *     const field = makeStarfield(ctx.rng)
 *     ctx.scene.add(field)
 *     registerUpdate(({ delta }) => field.rotation.y += delta * 0.01)
 *     return () => { ctx.scene.remove(field); field.geometry.dispose() }
 *   },
 * })
 */
export function createSceneModule (def: SceneModuleDefinition): SceneModule {
  const updates: FrameCallback[] = []
  let ctxRef: SceneContext | null = null
  let teardown: (() => void) | void

  return {
    name: def.name,
    build (ctx) {
      ctxRef = ctx

      const register = (cb: FrameCallback): void => {
        updates.push(cb)
        ctx.loop.registerUpdate(cb)
      }
      teardown = def.build(ctx, register)
    },
    dispose () {
      // unregister every frame callback this module added.
      if (ctxRef)
        for (const cb of updates)
          ctxRef.loop.unregisterUpdate(cb)
      updates.length = 0
      teardown?.()
      ctxRef = null
    },
  }
}
