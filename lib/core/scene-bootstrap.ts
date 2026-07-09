// lib/core/scene-bootstrap.ts
// Minimal scene bootstrap, refactored to delegate directly to createApp.
// Wires renderer + scene + camera + frame loop + pointer gesture +
// resize observer + dispose path.

import * as THREE from 'three'
import { createApp } from './app.js'
import type { FrameCallback, FrameLoop } from '../types.js'


/** Scene primitives handed to the {@link BootstrapSetup} callback. */
export interface BootstrapSetupContext {
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  loop:     FrameLoop
}

/**
 * One-time setup callback for {@link bootstrapScene}. Build the scene here;
 * optionally return a {@link FrameCallback} to run every frame before render.
 */
export type BootstrapSetup = (ctx: BootstrapSetupContext) => FrameCallback | void

/** Options for {@link bootstrapScene}. */
export interface BootstrapOptions {
  canvas:   HTMLCanvasElement

  /** Runs once after the scene is wired; may return a per-frame tick. */
  onSetup?: BootstrapSetup
}

/**
 * Running scene returned by {@link bootstrapScene}. `dispose` stops the loop
 * and tears down the underlying app — gestures, resize observer, lights,
 * scene contents, and renderer.
 */
export interface BootstrappedScene {
  renderer: THREE.WebGLRenderer
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
  loop:     FrameLoop
  dispose (): void
}

/**
 * Bootstrap a minimal animated scene in one call: renderer, scene, perspective
 * camera, frame loop, standard lighting, pointer orbit, and resize handling —
 * a thin convenience wrapper over {@link createApp} with defaults applied.
 * `onSetup` runs once with the wired primitives; a returned tick is invoked
 * every frame before render. The loop starts immediately.
 *
 * @param options - Canvas plus optional setup callback; see {@link BootstrapOptions}.
 * @returns A {@link BootstrappedScene} exposing the live primitives and `dispose()`.
 * @throws Error when `options.canvas` is missing.
 * @example
 * const { dispose } = bootstrapScene({
 *   canvas,
 *   onSetup ({ scene }) {
 *     const mesh = new THREE.Mesh(geometry, material)
 *     scene.add(mesh)
 *     return ({ delta }) => { mesh.rotation.y += delta }
 *   },
 * })
 * @see {@link createApp} for state, modules, and deterministic ticking.
 */
export function bootstrapScene ({ canvas, onSetup }: BootstrapOptions): BootstrappedScene {
  if (!canvas)
    throw new Error('canvas required')

  let userTick: FrameCallback | null = null

  const app = createApp({
    canvas,
    orbit:    true,
    lighting: true,
    onFrame:  (_state, frameCtx, _sceneCtx) => {
      if (userTick)
        userTick(frameCtx)
    }
  })

  const { scene, camera, renderer, loop } = app.ctx

  if (onSetup) {
    const tick = onSetup({
      scene,
      camera: camera as THREE.PerspectiveCamera,
      renderer,
      loop
    })
    if (tick)
      userTick = tick
  }

  app.start()

  return {
    renderer,
    scene,
    camera: camera as THREE.PerspectiveCamera,
    loop,
    dispose () {
      app.stop()
      app.dispose()
    }
  }
}
