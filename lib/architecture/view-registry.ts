// lib/architecture/view-registry.ts
// Pluggable per-view renderers with an LRU persistent-mount cache: switching
// views deactivates (but keeps) the previous renderer so switching back is
// instant; least-recently-used renderers beyond `limit` are disposed. The
// IViewRenderer seam from stellar-cartogrph, generalized.

import type * as THREE from 'three'

import type { Disposable, FrameContext, SceneContext } from '../types.js'


/**
 * One "view" of the app (a whole sub-scene). `update` advances animation;
 * `updateState` projects app state onto objects; `setActive` toggles
 * visibility/attachment when the view is entered/left.
 */
export interface ViewRenderer<S = unknown> extends Disposable {
  update? (frame: FrameContext): void
  updateState? (state: S): void
  getInteractiveObjects? (): THREE.Object3D[]
  setActive? (active: boolean): void
}

export interface ViewRegistryOptions<S> {
  create (key: string, ctx: SceneContext): ViewRenderer<S>

  /** Max cached renderers (including the active one). Default 4. */
  limit?: number
}

export interface ViewRegistry<S = unknown> extends Disposable {

  /** Get-or-create the renderer for `key`, make it active, LRU-evict overflow. */
  activate (key: string, ctx: SceneContext): ViewRenderer<S>
  active (): ViewRenderer<S> | null
  activeKey (): string | null
  get (key: string): ViewRenderer<S> | undefined

  /** Tick the ACTIVE renderer only. */
  update (frame: FrameContext): void
  updateState (state: S): void
}

export function createViewRegistry<S = unknown> ({ create, limit = 4 }: ViewRegistryOptions<S>): ViewRegistry<S> {
  // Map iteration order = insertion order; re-inserting on use makes it an LRU.
  const cache = new Map<string, ViewRenderer<S>>()
  let currentKey: string | null = null

  function activate (key: string, ctx: SceneContext): ViewRenderer<S> {
    if (currentKey === key) {
      const current = cache.get(key)
      if (current)
        return current
    }

    const previous = currentKey ? cache.get(currentKey) : undefined
    previous?.setActive?.(false)

    let renderer = cache.get(key)
    if (renderer)
      cache.delete(key)
    else
      renderer = create(key, ctx)
    cache.set(key, renderer)
    currentKey = key
    renderer.setActive?.(true)

    // evict least-recently-used beyond limit (never the active one)
    while (cache.size > limit) {
      const [ oldestKey, oldest ] = cache.entries().next().value as [string, ViewRenderer<S>]
      if (oldestKey === currentKey)
        break
      cache.delete(oldestKey)
      oldest.dispose()
    }
    return renderer
  }

  return {
    activate,
    active:    () => currentKey ? cache.get(currentKey) ?? null : null,
    activeKey: () => currentKey,
    get:       key => cache.get(key),
    update (frame) {
      if (currentKey)
        cache.get(currentKey)?.update?.(frame)
    },
    updateState (state) {
      if (currentKey)
        cache.get(currentKey)?.updateState?.(state)
    },
    dispose () {
      for (const renderer of cache.values())
        renderer.dispose()
      cache.clear()
      currentKey = null
    },
  }
}

// perf: cheap. the cache trades GPU memory (kept sub-scenes) for instant
// view switches; tune `limit` against your heaviest views.
