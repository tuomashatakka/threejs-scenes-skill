// lib/core/overlay.ts
// Overlay-scene compositing: a second scene (HUD, gizmos, selection markers)
// rendered on top of the main scene with depth cleared, so overlay objects are
// never occluded by world geometry. Two integration paths: a RenderPass for a
// composer/pipeline chain, or renderOverlay() after a plain renderer.render().

import * as THREE from 'three'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'

import { disposeScene } from './dispose.js'
import type { Disposable } from '../types.js'


/**
 * Handle returned by {@link createOverlayScene}. `dispose` frees the
 * geometries, materials, and textures of everything added to `scene`.
 */
export interface OverlayHandle extends Disposable {

  /** The overlay scene — add HUD elements, gizmos, and markers here. */
  scene: THREE.Scene

  /** Add after the main render pass: pipeline.register('overlay', overlay.pass). */
  pass: RenderPass
}

/**
 * Create a second scene rendered on top of the main one with the depth buffer
 * cleared, so overlay objects (HUD, gizmos, selection markers) are never
 * occluded by world geometry. Integrate either by registering the bundled
 * `pass` after the main render pass in a composer chain, or composer-free via
 * {@link renderOverlay} after a plain `renderer.render()`.
 *
 * @param camera - Camera the overlay is rendered through, usually the main scene camera.
 * @returns An {@link OverlayHandle} exposing the overlay `scene` and its `pass`.
 */
export function createOverlayScene (camera: THREE.Camera): OverlayHandle {
  const scene = new THREE.Scene()

  const pass      = new RenderPass(scene, camera)
  pass.clear      = false
  pass.clearDepth = true

  return {
    scene,
    pass,
    dispose () {
      disposeScene(scene)
    },
  }
}

/** Composer-free path: call after renderer.render(mainScene, camera). */
export function renderOverlay (
  renderer: THREE.WebGLRenderer,
  overlayScene: THREE.Scene,
  camera: THREE.Camera,
): void {
  renderer.clearDepth()
  renderer.render(overlayScene, camera)
}

// perf: one extra render pass over (usually few) overlay objects.
