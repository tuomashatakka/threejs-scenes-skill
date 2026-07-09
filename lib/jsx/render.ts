// lib/jsx/render.ts
// render() — the JSX entry point. Bootstraps renderer + scene + frame loop,
// mounts the element tree, then drives everything from ONE frame callback:
// apply reactive bindings, advance, render (through the composer if a <post>
// element built one). Reconciliation is the render tick — no separate scheduler.
// Returns a handle whose dispose() tears down the whole graph.

import * as THREE from 'three'

import { createRenderer, attachResizeObserver } from '../core/renderer.js'
import { createFrameLoop } from '../core/frame-loop.js'
import { attachPointerGesture } from '../core/pointer-gesture.js'
import { disposeScene } from '../core/dispose.js'
import { resizeIsoCamera } from '../camera/iso-camera.js'
import { createSeededRng } from '../procedural/rng.js'
import { mountTree } from './reconciler.js'
import type { ComposerHandle } from '../post/composer.js'
import type { ReactiveBinding, Runtime } from './components.js'
import type { SceneChild } from './jsx-runtime.js'
import type { FrameLoop } from '../types.js'


/** Options for `render()`. */
export interface RenderOptions {

  /** Canvas to render into (required). */
  canvas: HTMLCanvasElement

  /** Seed for the tree's deterministic RNG (default `1`). */
  seed?: number

  /** Scene background color. */
  background?: THREE.ColorRepresentation

  /** Attach drag/pinch/wheel orbit gestures to a perspective camera (default `true`). */
  orbit?: boolean
}

/**
 * Live handle returned by `render()`. The mounted graph mutates in place
 * while the loop runs; `dispose()` is the single teardown point.
 */
export interface RenderHandle {

  /** The mounted root scene. */
  scene: THREE.Scene

  /** The WebGL renderer bound to the canvas. */
  renderer: THREE.WebGLRenderer

  /** Frame loop driving reactivity and rendering. */
  loop: FrameLoop

  /** The active camera. */
  getCamera (): THREE.Camera

  /** Stop the loop, detach listeners, run all disposers, and free GPU resources. */
  dispose (): void
}

/**
 * Mount a JSX element tree onto a canvas and start rendering. The entry point
 * of the JSX layer.
 *
 * @remarks
 * Mounting is one-off — components run exactly once and there is no virtual
 * DOM. Each frame the loop re-reads every function-valued prop, writes the
 * result onto the live object, then renders (through the composer when a
 * `<post>` element built one). The frame loop is the reactivity system; no
 * separate scheduler exists.
 *
 * @param root - Element tree built with JSX or `h()`.
 * @param options - Target canvas plus seed, background and orbit settings.
 * @returns A `RenderHandle` whose `dispose()` tears the whole graph down.
 *
 * @example
 * ```tsx
 * const [spin, setSpin] = signal(0)
 * const handle = render(
 *   <scene background='#101018'>
 *     <light type='directional' position={[3, 5, 2]} />
 *     <mesh geometry={box} material={mat} rotation={() => [0, spin(), 0]} />
 *   </scene>,
 *   { canvas },
 * )
 * // …later: handle.dispose()
 * ```
 */
export function render (root: SceneChild, options: RenderOptions): RenderHandle {
  const { canvas, seed = 1, orbit = true } = options
  if (!canvas)
    throw new Error('render: a canvas is required')

  const renderer = createRenderer({ canvas })
  const scene    = new THREE.Scene()
  if (options.background !== undefined)
    scene.background = new THREE.Color(options.background)

  const loop = createFrameLoop()
  const rng  = createSeededRng(seed)
  const size = new THREE.Vector2()

  const getSize = (): [number, number] => {
    renderer.getSize(size)
    return [ size.x, size.y ]
  }
  const getAspect = (): number => {
    const [ w, h ] = getSize()
    return w / (h || 1)
  }

  let camera: THREE.Camera = new THREE.PerspectiveCamera(50, getAspect(), 0.1, 500)
  camera.position.set(4, 3, 6)
  camera.lookAt(0, 0, 0)

  let cameraChosen                    = false
  let manualCamera                    = false
  let composer: ComposerHandle | null = null
  const reactive: ReactiveBinding[]   = []
  const disposers: Array<() => void>  = []
  const postSetups: Array<() => void> = []

  const rt: Runtime & { disableOrbit (): void } = {
    scene,
    renderer,
    loop,
    rng,
    getCamera: () => camera,
    setCamera (cam, isDefault = true) {
      if (!cameraChosen || isDefault) {
        camera = cam
        cameraChosen = true
      }
    },
    getAspect,
    getSize,
    addReactive:  b => reactive.push(b),
    addDisposer:  fn => disposers.push(fn),
    addPostSetup: fn => postSetups.push(fn),
    setComposer:  h => {
      composer = h
    },
    disableOrbit () {
      manualCamera = true
    },
  }

  mountTree(root, rt)
  for (const setup of postSetups)
    setup()

  // orbit controls on a perspective camera unless a follow/manual camera owns it
  let detachGesture = (): void => {}
  if (orbit && !manualCamera && (camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
    let theta  = Math.atan2(camera.position.x, camera.position.z)
    let phi    = Math.atan2(camera.position.y, Math.hypot(camera.position.x, camera.position.z))
    let radius = camera.position.length()
    const updateCamera = (): void => {
      const r = radius * Math.cos(phi)
      camera.position.set(Math.sin(theta) * r, Math.sin(phi) * radius, Math.cos(theta) * r)
      camera.lookAt(0, 0, 0)
    }
    detachGesture = attachPointerGesture(canvas, {
      onDrag (dx, dy) {
        theta -= dx * 0.005
        phi = Math.max(-1.4, Math.min(1.4, phi + dy * 0.005))
        updateCamera()
      },
      onPinch (deltaScale) {
        radius = Math.max(2, Math.min(80, radius / deltaScale))
        updateCamera()
      },
      onWheel (delta) {
        radius = Math.max(2, Math.min(80, radius * (1 + delta * 0.001)))
        updateCamera()
      },
    })
  }

  const detachResize = attachResizeObserver(renderer, camera, canvas, (w, h) => {
    composer?.setSize(w, h)

    const cam = camera as THREE.OrthographicCamera
    if (cam.isOrthographicCamera)
      resizeIsoCamera(cam, w / (h || 1))
  })

  renderer.compile(scene, camera)

  const stopFrame = loop.onFrame(ctx => {
    for (const binding of reactive)
      binding.apply(binding.get())
    if (composer)
      composer.composer.render(ctx.delta)
    else
      renderer.render(scene, camera)
  })

  function dispose (): void {
    stopFrame()
    loop.dispose()
    detachGesture()
    detachResize()
    for (const d of disposers)
      d()
    composer?.dispose()
    disposeScene(scene)
    renderer.dispose()
  }

  return { scene, renderer, loop, getCamera: () => camera, dispose }
}

// perf: one rAF, one render per frame. Reactive cost = #reactive-props function
// calls per frame. Everything is disposed in dispose() — no GPU leak on unmount.
