// lib/types.ts
// Shared interfaces and type contracts for the threejs-scenes library.

import type * as THREE from 'three'

/**
 * Anything that owns GPU or DOM resources and must be torn down explicitly.
 * three.js never auto-frees GPU memory — see references/production-lessons.md.
 */
export interface Disposable {
  dispose (): void
}

/**
 * Per-frame context handed to every animated subsystem by the frame loop.
 * `delta` is seconds since the last frame, `elapsed` is total seconds,
 * `frame` is a monotonically increasing frame counter.
 */
export interface FrameContext {
  delta:   number
  elapsed: number
  frame:   number
}

/** Per-frame subscriber invoked with the shared {@link FrameContext}. */
export type FrameCallback = (ctx: FrameContext) => void

/**
 * Off-thread frame handler run inside a Web Worker by
 * {@link FrameLoop.registerWorkerUpdate}. Receives the frame context and the
 * previous state; returning a value replaces the state, returning `undefined`
 * keeps it (useful when mutating `state` in place).
 *
 * @remarks
 * The function is serialized with `Function.prototype.toString()` and
 * rehydrated inside the worker, so it MUST be self-contained: no captured
 * closure variables, no imports, no `this`. Everything it needs must arrive
 * through `ctx` and `state`.
 *
 * @typeParam S - Worker-held state; must survive structured clone (plain
 * data, TypedArrays, Map/Set — not three.js objects or functions).
 */
export type WorkerUpdateFn<S> = (ctx: FrameContext, state: S) => S | void

/** Options for {@link FrameLoop.registerWorkerUpdate}. */
export interface WorkerUpdateOptions<S> {

  /** State seeded into the worker before the first tick. */
  initialState?: S

  /** Called on the main thread with the state after each completed tick. */
  onResult?: (state: S) => void

  /**
   * Called on the main thread when the handler throws inside the worker or a
   * tick fails to post (e.g. non-cloneable state).
   * @defaultValue logs via `console.error`
   */
  onError?: (error: Error) => void
}

/** Handle returned by {@link FrameLoop.registerWorkerUpdate}. */
export interface WorkerUpdateHandle {

  /** Detach from the loop; the worker stays warm and can be re-driven later. */
  unregister (): void

  /** Detach, terminate the worker, and revoke its blob URL. */
  terminate (): void
}

/**
 * Self-contained Clock-driven frame loop. Every animated subsystem registers
 * through `onFrame` and receives a single shared {@link FrameContext}.
 * Mirrors the inlined loop in the templates — no exotic dependency.
 */
export interface FrameLoop extends Disposable {

  /** Subscribe to every frame. Auto-starts the loop; returns an unsubscribe. */
  onFrame (cb: FrameCallback): () => void

  /** Alias of {@link FrameLoop.onFrame} mirroring the SceneModule lifecycle API. */
  registerUpdate (cb: FrameCallback): () => void

  /** Remove a subscriber previously added via `onFrame`/`registerUpdate`. */
  unregisterUpdate (cb: FrameCallback): void

  /**
   * Run `fn` off the main thread: the handler is serialized into an inline
   * blob-URL module worker, receives `{ delta, elapsed, frame }` ticks, and
   * round-trips `state` via structured clone. Ticks are coalesced latest-wins
   * while the worker is busy (`delta` sums, `elapsed`/`frame` jump), so worker
   * updates are never fixed-step even on an fps-capped loop. Falls back to
   * same-thread microtask scheduling when workers are unavailable (e.g. CSP
   * without `worker-src blob:`, non-browser runtimes).
   *
   * @param fn - Self-contained handler; see {@link WorkerUpdateFn} for the
   * no-closure restriction.
   * @param options - Initial state plus main-thread result/error callbacks.
   * @returns A {@link WorkerUpdateHandle}; `dispose()` on the loop terminates
   * all worker updates it owns.
   * @throws Error if `fn` is a native/bound function or not expressible as
   * source (e.g. object method shorthand).
   * @example
   * const loop = createFrameLoop()
   * const sim = loop.registerWorkerUpdate(
   *   (ctx, state) => ({ angle: state.angle + ctx.delta }),
   *   { initialState: { angle: 0 }, onResult: s => { mesh.rotation.y = s.angle } },
   * )
   * // later: sim.terminate()
   */
  registerWorkerUpdate<S = unknown> (fn: WorkerUpdateFn<S>, options?: WorkerUpdateOptions<S>): WorkerUpdateHandle

  /** Begin pumping frames (registered automatically by the first subscriber). */
  start (): void

  /** Stop pumping without clearing subscribers. */
  stop (): void
}

/**
 * Unified pointer gesture callbacks. The same handlers fire for mouse, touch,
 * and pen — always prefer this over discrete mouse/touch listeners.
 */
export interface PointerGestureCallbacks {
  onDrag?:  (dx: number, dy: number, event: PointerEvent) => void
  onPinch?: (deltaScale: number, centerX: number, centerY: number) => void
  onTap?:   (x: number, y: number, event: PointerEvent) => void
  onWheel?: (delta: number, event: WheelEvent) => void
}

export interface PointerGestureOptions {
  tapThresholdMs?: number
  tapMovePx?:      number
}

export type QualityTier = 'mobile' | 'desktop' | 'highEnd'

export type PostEffectName =
  | 'bloom' |
  'dof' |
  'godRays' |
  'filmGrain' |
  'glitch'

export interface QualityPreset {
  pixelRatio:      number
  shadowMapSize:   number
  shadowsEnabled:  boolean
  postFx:          PostEffectName[]
  chunkViewRadius: number
  particleBudget:  number
  maxLights:       number
}

export interface QualitySettings extends QualityPreset {
  tier: QualityTier
}

/**
 * Seeded pseudo-random stream. `fork(label)` derives a deterministic
 * sub-stream from a label hash — the determinism lesson: seed once, fork per
 * consumer so build order and undo/redo replay never change the output.
 */
export interface SeededRng {
  next (): number
  range (min: number, max: number): number
  int (minInclusive: number, maxInclusive: number): number
  pick<T> (items: readonly T[]): T
  fork (label: string): SeededRng
}

/**
 * Context injected into every scene module. Modules never reach for globals —
 * this kills init-order bugs and keeps modules testable headless.
 */
export interface SceneContext {
  scene:      THREE.Scene
  camera:     THREE.Camera
  renderer:   THREE.WebGLRenderer
  rng:        SeededRng
  loop:       FrameLoop
  ground?:    THREE.Object3D
  materials?: MaterialPoolLike
  models?:    Record<string, THREE.Object3D>
}

/**
 * A self-contained scene feature. `build` receives the {@link SceneContext};
 * `dispose` frees only what the module created (never shared/pooled resources).
 */
export interface SceneModule {
  name: string
  build (ctx: SceneContext): void
  dispose (): void
}

/**
 * Minimal structural type for a material pool, so {@link SceneContext} can
 * reference one without importing the concrete class.
 */
export interface MaterialPoolLike {
  get<T extends THREE.Material> (key: string, factory: () => T): T
}

/** A parameter specification used to coerce config- or LLM-driven content. */
export type ParamSpec =
  | { kind: 'number'; default: number; min?: number; max?: number } |
  { kind: 'int'; default: number; min?: number; max?: number } |
  { kind: 'boolean'; default: boolean } |
  { kind: 'string'; default: string } |
  { kind: 'enum'; default: string; options: readonly string[] }

export type ParamValue = number | boolean | string

export type ParamSpecMap = Record<string, ParamSpec>

// --- loaders ---

/** Normalized result of loading a model file (glTF and friends). */
export interface LoadedModel {
  scene:      THREE.Object3D
  animations: THREE.AnimationClip[]
  cameras:    THREE.Camera[]
  asset?:     unknown
}

// --- animation ---

export interface PlayOptions {
  loop?:              THREE.AnimationActionLoopStyles
  fadeIn?:            number
  reset?:             boolean
  clampWhenFinished?: boolean
  timeScale?:         number
}

/**
 * Wraps an AnimationMixer + its actions. `tick(ctx)` advances by ctx.delta;
 * when built with a FrameLoop it auto-registers so playback follows the render
 * loop. `dispose` uncaches the root and unregisters the tick.
 */
export interface AnimationController extends Disposable {
  mixer:   THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  play (name: string, options?: PlayOptions): THREE.AnimationAction | null
  crossfade (from: string, to: string, duration?: number): void
  stop (name?: string): void
  tick (ctx: FrameContext): void
}

// --- props ---

/** Minimal context a prop needs to build + animate itself. SceneContext satisfies it. */
export interface PropContext {
  rng?:  SeededRng
  loop?: FrameLoop
}

export type InstancePlaceFn = (
  index: number,
  rng: () => number,
  object: THREE.Object3D,
  color: THREE.Color,
) => void

/**
 * Declarative description of a reusable prop: how to build its Object3D, plus
 * optional animation clips, embedded lights, and an instancing hint. Author one
 * with `defineProp` and mount it with `createProp` (or via <Prop src>).
 */
export interface PropDefinition {
  name:       string
  build (ctx: PropContext): THREE.Object3D
  clips? (root: THREE.Object3D): THREE.AnimationClip[]
  lights? (root: THREE.Object3D): THREE.Light[]
  instanced?: { count: number; radius?: number; seed?: number; place?: InstancePlaceFn }
}

export type PropFactory = PropDefinition

/** A live, mounted prop. `dispose` frees geometry/materials/controller it owns. */
export interface PropInstance extends Disposable {
  object:      THREE.Object3D
  controller?: AnimationController
  lights:      THREE.Light[]
}
