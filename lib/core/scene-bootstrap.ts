// lib/core/scene-bootstrap.ts
// Minimal scene bootstrap, refactored to delegate directly to createApp.
// Wires renderer + scene + camera + frame loop + pointer gesture +
// resize observer + dispose path.

import * as THREE from 'three'
import { createApp } from './app.js'
import type { FrameCallback, FrameLoop } from '../types.js'


export interface BootstrapSetupContext {
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  loop:     FrameLoop
}

export type BootstrapSetup = (ctx: BootstrapSetupContext) => FrameCallback | void

export interface BootstrapOptions {
  canvas:   HTMLCanvasElement
  onSetup?: BootstrapSetup
}

export interface BootstrappedScene {
  renderer: THREE.WebGLRenderer
  scene:    THREE.Scene
  camera:   THREE.PerspectiveCamera
  loop:     FrameLoop
  dispose (): void
}

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
