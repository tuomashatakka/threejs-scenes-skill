// lib/post/stereoscopy.ts
// Stereo render modes. AnaglyphEffect for red/cyan glasses, StereoEffect for
// cardboard-style side-by-side. Both bypass EffectComposer — pick one mode per
// session. Ported from scripts/stereoscopy.js.

import type * as THREE from 'three'
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js'
import { StereoEffect } from 'three/addons/effects/StereoEffect.js'

import type { Disposable } from '../types.js'


/** Render mode for stereoscopic 3D: anaglyph (red/cyan), side-by-side stereo, or off (passthrough). */
export type StereoMode = 'anaglyph' | 'stereo' | 'off'

/** Renderer wrapper for anaglyph or side-by-side stereo output. Both bypass EffectComposer. */
export interface StereoRenderer extends Disposable {
  mode: StereoMode
  render (scene: THREE.Scene, camera: THREE.Camera): void
  setSize (w: number, h: number): void
}

/** Optional size override for the stereo effect render target. */
export interface StereoSizeOptions {
  width?:  number
  height?: number
}

/** Create a StereoRenderer for the given mode. AnaglyphEffect for red/cyan glasses, StereoEffect for cardboard-style side-by-side. */
export function createStereoRenderer (
  renderer: THREE.WebGLRenderer,
  mode: StereoMode,
  { width, height }: StereoSizeOptions = {},
): StereoRenderer {
  if (mode === 'anaglyph') {
    const fx = new AnaglyphEffect(renderer)
    if (width && height)
      fx.setSize(width, height)
    return {
      mode:    'anaglyph',
      render:  (scene, camera) => fx.render(scene, camera),
      setSize: (w, h) => fx.setSize(w, h),
      dispose: () => fx.dispose?.(),
    }
  }
  if (mode === 'stereo') {
    const fx = new StereoEffect(renderer)
    if (width && height)
      fx.setSize(width, height)
    return {
      mode:    'stereo',
      render:  (scene, camera) => fx.render(scene, camera),
      setSize: (w, h) => fx.setSize(w, h),
      dispose: () => {},
    }
  }
  return {
    mode:    'off',
    render:  (scene, camera) => renderer.render(scene, camera),
    setSize: (w, h) => renderer.setSize(w, h),
    dispose: () => {},
  }
}

// perf: doubles render cost (two eyes). Combine with stereo + post-fx only on
// desktop / high-end tier.
