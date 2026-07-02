// lib/core/app.ts
// Unidirectional app shell: one store, one clock, one render loop. Data flows
// store -> module.update(state, frame) -> scene each tick; input handlers call
// app.setState()/dispatch(), never mutate the scene directly. All randomness
// derives from the injected seed. tick() pumps the simulation manually so the
// same seed + the same tick sequence reproduce the exact same world —
// deterministic replays and headless tests for free.

import * as THREE from 'three'

import { createRenderer, attachResizeObserver } from './renderer.js'
import { createFrameLoop } from './frame-loop.js'
import { attachPointerGesture } from './pointer-gesture.js'
import { disposeScene } from './dispose.js'
import { createClock } from './clock.js'
import { createStore } from './state.js'
import { setupStandardLighting } from '../lighting/lighting.js'
import { createSeededRng } from '../procedural/rng.js'
import type { Clock } from './clock.js'
import type { Store, Reducer } from './state.js'
import type { RendererOptions } from './renderer.js'
import type { FrameContext, SceneContext, Disposable } from '../types.js'


/**
 * A scene feature in the unidirectional flow. `build` creates objects once;
 * `update` projects the current state onto them every simulation tick. Modules
 * read state — they never write it back.
 */
export interface AppModule<S extends object = Record<string, unknown>> {
  name: string
  build (ctx: SceneContext): void
  update? (state: S, frame: FrameContext, ctx: SceneContext): void
  dispose (): void
}

export interface AppCameraOptions {
  fov?:      number
  near?:     number
  far?:      number
  position?: readonly [number, number, number]
  lookAt?:   readonly [number, number, number]
}

export interface AppOptions<S extends object, A = Partial<S>> {
  canvas: HTMLCanvasElement

  /** Initial serializable app state. Defaults to an empty object. */
  state?:   S
  reducer?: Reducer<S, A>
  seed?:    number

  /** Injectable time source. Pass createClock({ mode: 'fixed' }) for determinism. */
  clock?:      Clock
  renderer?:   Omit<RendererOptions, 'canvas'>
  camera?:     AppCameraOptions
  background?: THREE.ColorRepresentation

  /** Standard three-light rig. Default true. */
  lighting?: boolean

  /** Built-in pointer orbit. Default true; disable when using a camera controller. */
  orbit?:   boolean
  modules?: AppModule<S>[]

  /** Runs after module updates, before render — the place for app-level per-frame glue. */
  onFrame?: (state: S, frame: FrameContext, ctx: SceneContext) => void
}

export interface App<S extends object, A = Partial<S>> extends Disposable {
  ctx:   SceneContext
  store: Store<S, A>
  getState (): S
  setState (patch: Partial<S>): void
  dispatch (action: A): void

  /** Advance the simulation by `realDelta` seconds (default: one clock step) and render. */
  tick (realDelta?: number): void
  start (): void
  stop (): void
}

export function createApp<S extends object = Record<string, unknown>, A = Partial<S>> ({
  canvas,
  state = {} as S,
  reducer,
  seed = 1,
  clock = createClock(),
  renderer: rendererOptions,
  camera: cameraOptions,
  background = '#0a0a14',
  lighting = true,
  orbit = true,
  modules = [],
  onFrame,
}: AppOptions<S, A>): App<S, A> {
  if (!canvas)
    throw new Error('createApp: canvas required')

  const renderer   = createRenderer({ canvas, ...rendererOptions })
  const scene      = new THREE.Scene()
  scene.background = new THREE.Color(background)

  const aspect = canvas.clientWidth / canvas.clientHeight || 1
  const camera = new THREE.PerspectiveCamera(
    cameraOptions?.fov ?? 50,
    aspect,
    cameraOptions?.near ?? 0.1,
    cameraOptions?.far ?? 200,
  )
  camera.position.set(...cameraOptions?.position ?? [ 4, 3, 6 ])
  camera.lookAt(new THREE.Vector3(...cameraOptions?.lookAt ?? [ 0, 0, 0 ]))

  const lights = lighting ? setupStandardLighting(scene, renderer) : null
  const store  = createStore<S, A>(state, reducer)
  const rng    = createSeededRng(seed)
  const loop   = createFrameLoop()

  const ctx: SceneContext = { scene, camera, renderer, rng, loop }

  // optional built-in orbit — input mutates state? no: the orbit is view-only
  // camera manipulation, deliberately outside app state (like scrolling a page).
  let detachGesture: (() => void) | null = null
  if (orbit) {
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
        phi    = Math.max(-1.4, Math.min(1.4, phi + dy * 0.005))
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
  }

  const detachResize = attachResizeObserver(renderer, camera, canvas)

  for (const module of modules)
    module.build(ctx)
  renderer.compile(scene, camera)

  // one simulation tick: state -> modules -> onFrame. Never the reverse.
  let frame = 0
  function step (delta: number): void {
    frame += 1

    const frameCtx: FrameContext = { delta, elapsed: clock.elapsed(), frame }
    const current                = store.get()
    for (const module of modules)
      module.update?.(current, frameCtx, ctx)
    onFrame?.(current, frameCtx, ctx)
  }

  function pump (realDelta: number): void {
    for (const delta of clock.advance(realDelta))
      step(delta)
    renderer.render(scene, camera)
  }

  const stopFrame = loop.onFrame(({ delta }) => pump(delta))
  loop.stop()

  return {
    ctx,
    store,
    getState: store.get,
    setState: patch => store.set(patch),
    dispatch: action => store.dispatch(action),
    tick (realDelta = 1 / 60) {
      pump(realDelta)
    },
    start: () => loop.start(),
    stop:  () => loop.stop(),
    dispose () {
      stopFrame()
      loop.dispose()
      detachGesture?.()
      detachResize()
      lights?.dispose()
      for (const module of modules)
        module.dispose()
      disposeScene(scene)
      renderer.dispose()
    },
  }
}

// perf: cheap scaffolding — one rAF, one Set iteration, one render per frame.
// Fixed-clock mode may run 0..maxSubSteps sim ticks per rAF but still renders once.
