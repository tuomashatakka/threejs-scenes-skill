// scripts/scene-bootstrap.js
// Minimal scene bootstrap. Wires renderer + scene + camera + frame loop +
// pointer gesture + resize observer + dispose path. Copy this as a starting
// point for any new scene.

import * as THREE from 'three'

import { createRenderer, attachResizeObserver } from './renderer-setup.js'
import { startRenderLoop, onFrame } from './frame-loop.js'
import { attachPointerGesture } from './pointer-gesture.js'
import { setupStandardLighting } from './lighting-setup.js'
import { disposeScene } from './dispose-scene.js'


export function bootstrapScene ({ canvas, onSetup } = {}) {
  if (!canvas)
    throw new Error('canvas required')

  const renderer   = createRenderer({ canvas })
  const scene      = new THREE.Scene()
  scene.background = new THREE.Color('#0a0a14')

  const aspect = canvas.clientWidth / canvas.clientHeight
  const camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 200)
  camera.position.set(4, 3, 6)
  camera.lookAt(0, 0, 0)

  const lighting = setupStandardLighting(scene, renderer)

  // pointer-driven camera orbit
  let theta  = Math.atan2(camera.position.x, camera.position.z)
  let phi    = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z))
  let radius = camera.position.length()

  const detachGesture = attachPointerGesture(canvas, {
    onDrag (dx, dy) {
      theta -= dx * 0.005
      phi = Math.max(-1.4, Math.min(1.4, phi + dy * 0.005))
      updateCamera()
    },
    onPinch (deltaScale) {
      radius = Math.max(2, Math.min(50, radius / deltaScale))
      updateCamera()
    },
    onWheel (delta) {
      radius = Math.max(2, Math.min(50, radius * (1 + delta * 0.001)))
      updateCamera()
    },
  })

  function updateCamera () {
    const r = radius * Math.cos(phi)
    camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r)
    camera.lookAt(0, 0, 0)
  }

  const detachResize = attachResizeObserver(renderer, camera, canvas)

  // user content
  const userTicks = []
  if (onSetup) {
    const tick = onSetup({ scene, camera, renderer })
    if (tick)
      userTicks.push(tick)
  }

  // pre-warm shaders so the first frame doesn't stall
  renderer.compile(scene, camera)

  // single combined frame callback
  const stopFrameTick = onFrame(ctx => {
    for (const t of userTicks)
      t(ctx)
  })
  const stopRender = startRenderLoop({ renderer, scene, camera })

  function dispose () {
    stopFrameTick()
    stopRender()
    detachGesture()
    detachResize()
    lighting.dispose()
    disposeScene(scene)
    renderer.dispose()
  }

  return { renderer, scene, camera, dispose }
}

// perf: cheap. one renderer, one scene, one camera, one rAF.
