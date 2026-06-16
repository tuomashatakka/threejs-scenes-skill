// lib/architecture/procedural-texture.ts
// Lazy CanvasTexture cache. Surface variation comes from CanvasTexture painted
// with seeded noise, not image files (production-lessons.md). DOM-guarded:
// returns null in a headless runner so codegen/tests degrade to flat colour
// instead of crashing.

import * as THREE from 'three'

import type { Disposable } from '../types.js'


export type PaintFn = (
  ctx: CanvasRenderingContext2D,
  size: number,
) => void

const cache = new Map<string, THREE.CanvasTexture>()

export function createProceduralTexture (
  key: string,
  paint: PaintFn,
  size = 256,
): THREE.CanvasTexture | null {
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
}

export const proceduralTextureCache: Disposable = {
  dispose () {
    for (const tex of cache.values())
      tex.dispose()
    cache.clear()
  },
}

// perf: cheap once painted; cached by key so repeated requests are free.
