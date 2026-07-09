// lib/post/stereoscopy.ts
// Stereo render modes. AnaglyphEffect for red/cyan glasses, StereoEffect for
// cardboard-style side-by-side. Both bypass EffectComposer — pick one mode per
// session. Ported from scripts/stereoscopy.js.

import type * as THREE from 'three'
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js'
import { StereoEffect } from 'three/addons/effects/StereoEffect.js'

import type { Disposable } from '../types.js'




/** Render mode for stereoscopic 3D: `anaglyph` (red/cyan glasses), `stereo` (cardboard-style side-by-side), or `off` (passthrough, single render). */
export type StereoMode = 'anaglyph' | 'stereo' | 'off'



/** A renderer wrapper that renders the scene in the selected stereo mode. Both anaglyph and stereo modes bypass {@link EffectComposer} — pick one mode per session. */
export interface StereoRenderer extends Disposable {
  mode: StereoMode
  render (scene: THREE.Scene, camera: THREE.Camera): void
  setSize (w: number, h: number): void
}



/** Optional output-size override for the stereo-effect render target. */
export interface StereoSizeOptions {
  width?:  number
  height?: number
}



/**
 * Create a stereo renderer that wraps the given WebGL2 renderer in an anaglyph or side-by-side stereo effect.
 *
 * @param renderer - The WebGL2 renderer to wrap.
 * @param mode - Stereo mode: `anaglyph`, `stereo`, or `off` (passthrough).
 * @param options - Optional viewport-size override.
 * @param options.width - Override width for the stereo-effect render target.
 * @param options.height - Override height for the stereo-effect render target.
 * @returns A {@link StereoRenderer}. Call `render(scene, camera)` to render the scene through the selected stereo effect.
 * @remarks Stereo mode doubles the render cost (two eyes). Combine with post-processing only on desktop or high-end tier.
 */
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
