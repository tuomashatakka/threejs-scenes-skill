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
import type { RendererOptions, ResizeHandler } from './renderer.js'
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

/**
 * Perspective-camera setup for {@link createApp}. Defaults: `fov` 50,
 * `near` 0.1, `far` 200, `position` [4, 3, 6], `lookAt` the origin.
 */
export interface AppCameraOptions {
  fov?:      number
  near?:     number
  far?:      number
  position?: readonly [number, number, number]
  lookAt?:   readonly [number, number, number]
}

/**
 * Configuration for {@link createApp}. Only `canvas` is required — every other
 * option has a sensible default (lighting on, orbit on, wall clock, seed 1).
 */
export interface AppOptions<S extends object, A = Partial<S>> {

  /** Target canvas. The renderer sizes itself to the canvas parent. */
  canvas: HTMLCanvasElement

  /** Initial serializable app state. Defaults to an empty object. */
  state?: S

  /** Optional reducer enabling `app.dispatch(action)` alongside `setState`. */
  reducer?: Reducer<S, A>

  /**
   * Seed for the injected {@link SceneContext.rng}. Same seed + same tick
   * sequence reproduce the same world.
   * @defaultValue 1
   */
  seed?: number

  /** Injectable time source. Pass createClock({ mode: 'fixed' }) for determinism. */
  clock?: Clock

  /** Renderer factory options forwarded to `createRenderer` (minus `canvas`). */
  renderer?: Omit<RendererOptions, 'canvas'>

  /** Perspective-camera options, or a prebuilt camera (e.g. an iso ortho rig). */
  camera?:     AppCameraOptions | THREE.Camera
  background?: THREE.ColorRepresentation

  /** Runs after the built-in resize handling — resize ortho frustums, composers, … */
  onResize?: ResizeHandler

  /** Replaces the default renderer.render(scene, camera) — wire a composer here. */
  render?: () => void

  /** Standard three-light rig. Default true. */
  lighting?: boolean

  /** Built-in pointer orbit. Default true; disable when using a camera controller. */
  orbit?: boolean

  /** Scene features built once at creation and updated every simulation tick. */
  modules?: AppModule<S>[]

  /** Runs after module updates, before render — the place for app-level per-frame glue. */
  onFrame?: (state: S, frame: FrameContext, ctx: SceneContext) => void
}

/**
 * Running app shell returned by {@link createApp}. Drive it with the built-in
 * frame loop (`start`/`stop`) or pump the simulation manually with `tick`;
 * `dispose` tears down the loop, gestures, modules, scene, and renderer.
 */
export interface App<S extends object, A = Partial<S>> extends Disposable {
  ctx:   SceneContext
  store: Store<S, A>
  getState (): S

  /** Shallow-merge `patch` into app state and notify store subscribers. */
  setState (patch: Partial<S>): void

  /** Run the reducer. Throws when the app was created without one. */
  dispatch (action: A): void

  /** Advance the simulation by `realDelta` seconds (default: one clock step) and render. */
  tick (realDelta?: number): void

  /** Attach to the shared frame loop and animate continuously. */
  start (): void

  /** Detach from the frame loop; state and scene stay intact. */
  stop (): void
}

/**
 * Build a complete unidirectional app shell: renderer, scene, camera, seeded
 * rng, store, clock, and one shared frame loop wired together. Each simulation
 * tick flows store state through `module.update(state, frame, ctx)` and then
 * `onFrame` before a single render; input goes back through
 * `setState`/`dispatch`, never straight into the scene.
 *
 * The loop starts paused — call `start()` to animate, or `tick()` to step
 * deterministically (headless tests, replays).
 *
 * @param options - App configuration; see {@link AppOptions}. Only `canvas` is required.
 * @returns An {@link App} handle. `dispose()` stops the loop, detaches gestures
 * and the resize observer, disposes modules, lights, scene, and renderer.
 * @throws Error when `options.canvas` is missing.
 * @typeParam S - Serializable app state shape.
 * @typeParam A - Action type for the optional reducer; defaults to `Partial<S>`.
 * @remarks Modules are built and the scene pre-compiled synchronously inside
 * this call. The built-in orbit is view-only camera manipulation, deliberately
 * outside app state; pass `orbit: false` when mounting your own controller.
 * @example
 * const app = createApp({
 *   canvas,
 *   state: { speed: 1 },
 *   modules: [ turbineModule ],
 *   onFrame: (state, frame) => hud.update(state, frame.delta),
 * })
 * app.start()
 * // later: app.setState({ speed: 2 }); app.dispose()
 */
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
  onResize,
  render,
}: AppOptions<S, A>): App<S, A> {
  if (!canvas)
    throw new Error('createApp: canvas required')

  const renderer   = createRenderer({ canvas, ...rendererOptions })
  const scene      = new THREE.Scene()
  scene.background = new THREE.Color(background)

  let camera: THREE.Camera
  if (cameraOptions instanceof THREE.Camera)
    camera = cameraOptions
  else {
    const aspect      = canvas.clientWidth / canvas.clientHeight || 1
    const perspective = new THREE.PerspectiveCamera(
      cameraOptions?.fov ?? 50,
      aspect,
      cameraOptions?.near ?? 0.1,
      cameraOptions?.far ?? 200,
    )
    perspective.position.set(...cameraOptions?.position ?? [ 4, 3, 6 ])
    perspective.lookAt(new THREE.Vector3(...cameraOptions?.lookAt ?? [ 0, 0, 0 ]))
    camera = perspective
  }

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

  const detachResize = attachResizeObserver(renderer, camera, canvas, onResize)

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
    if (render)
      render()
    else
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
