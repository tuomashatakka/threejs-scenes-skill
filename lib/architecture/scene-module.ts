// lib/architecture/scene-module.ts
// Context-injection scene module helper. Every scene feature is a factory
// returning { name, build(ctx), dispose() }. Modules never reach for globals —
// they receive a SceneContext, register animated work via loop.registerUpdate
// in build(), and unregister + free only what they own in dispose()
// (production-lessons.md architecture section).

import type { FrameCallback, SceneContext, SceneModule } from '../types.js'


export interface SceneModuleDefinition {
  name: string
  build (ctx: SceneContext, registerUpdate: (cb: FrameCallback) => void): void | (() => void)
}

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
