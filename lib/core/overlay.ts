// lib/core/overlay.ts
// Overlay-scene compositing: a second scene (HUD, gizmos, selection markers)
// rendered on top of the main scene with depth cleared, so overlay objects are
// never occluded by world geometry. Two integration paths: a RenderPass for a
// composer/pipeline chain, or renderOverlay() after a plain renderer.render().

import * as THREE from 'three'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'

import { disposeScene } from './dispose.js'
import type { Disposable } from '../types.js'


export interface OverlayHandle extends Disposable {
  scene: THREE.Scene

  /** Add after the main render pass: pipeline.register('overlay', overlay.pass). */
  pass: RenderPass
}

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
