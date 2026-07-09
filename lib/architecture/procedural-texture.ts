// lib/architecture/procedural-texture.ts
// Lazy CanvasTexture cache. Surface variation comes from CanvasTexture painted
// with seeded noise, not image files (production-lessons.md). DOM-guarded:
// returns null in a headless runner so codegen/tests degrade to flat colour
// instead of crashing.

import * as THREE from 'three'

import type { Disposable } from '../types.js'


/** Paints one procedural texture onto a square 2D canvas of `size` pixels. */
export type PaintFn = (
  ctx: CanvasRenderingContext2D,
  size: number,
) => void

// An explicit, owned texture cache — prefer this over the module-global one
// so texture lifetime follows your scene (unidirectional-API form).
/** An owned, keyed `CanvasTexture` cache — prefer this over the module-global {@link createProceduralTexture} so texture lifetime follows your scene. `dispose()` frees every cached texture. */
export interface TextureCache extends Disposable {
  get (key: string, paint: PaintFn, size?: number): THREE.CanvasTexture | null
}

/**
 * Create an owned procedural-texture cache. `get(key, paint, size)` paints a
 * square canvas once per key, wraps it in a repeat-wrapping `CanvasTexture`,
 * and returns the cached instance thereafter.
 *
 * @returns A {@link TextureCache}; `get` returns `null` in DOM-less runtimes
 * so headless code degrades to flat colour instead of crashing.
 */
export function createTextureCache (): TextureCache {
  const cache = new Map<string, THREE.CanvasTexture>()
  return {
    get (key, paint, size = 256) {
      // DOM-guard: degrade to null (flat colour) headless.
      if (typeof document === 'undefined')
        return null

      const existing = cache.get(key)
      if (existing)
        return existing

      const canvas  = document.createElement('canvas')
      canvas.width  = size
      canvas.height = size

      const ctx     = canvas.getContext('2d')
      if (!ctx)
        return null
      paint(ctx, size)

      const texture       = new THREE.CanvasTexture(canvas)
      texture.wrapS       = texture.wrapT = THREE.RepeatWrapping
      texture.needsUpdate = true
      cache.set(key, texture)
      return texture
    },
    dispose () {
      for (const tex of cache.values())
        tex.dispose()
      cache.clear()
    },
  }
}

// module-global convenience instance, kept for back-compat.
const shared = createTextureCache()

/** Fetch-or-paint a texture from the shared module-global cache. Same contract as {@link TextureCache.get}; returns `null` headless. */
export function createProceduralTexture (
  key: string,
  paint: PaintFn,
  size = 256,
): THREE.CanvasTexture | null {
  return shared.get(key, paint, size)
}

/** Disposer for the shared module-global texture cache used by {@link createProceduralTexture}. */
export const proceduralTextureCache: Disposable = {
  dispose () {
    shared.dispose()
  },
}

// perf: cheap once painted; cached by key so repeated requests are free.
