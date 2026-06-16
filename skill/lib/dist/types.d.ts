import type * as THREE from 'three';
/**
 * Anything that owns GPU or DOM resources and must be torn down explicitly.
 * three.js never auto-frees GPU memory — see references/production-lessons.md.
 */
export interface Disposable {
    dispose(): void;
}
/**
 * Per-frame context handed to every animated subsystem by the frame loop.
 * `delta` is seconds since the last frame, `elapsed` is total seconds,
 * `frame` is a monotonically increasing frame counter.
 */
export interface FrameContext {
    delta: number;
    elapsed: number;
    frame: number;
}
export type FrameCallback = (ctx: FrameContext) => void;
/**
 * Self-contained Clock-driven frame loop. Every animated subsystem registers
 * through `onFrame` and receives a single shared {@link FrameContext}.
 * Mirrors the inlined loop in the templates — no exotic dependency.
 */
export interface FrameLoop extends Disposable {
    onFrame(cb: FrameCallback): () => void;
    registerUpdate(cb: FrameCallback): () => void;
    unregisterUpdate(cb: FrameCallback): void;
    start(): void;
    stop(): void;
}
/**
 * Unified pointer gesture callbacks. The same handlers fire for mouse, touch,
 * and pen — always prefer this over discrete mouse/touch listeners.
 */
export interface PointerGestureCallbacks {
    onDrag?: (dx: number, dy: number, event: PointerEvent) => void;
    onPinch?: (deltaScale: number, centerX: number, centerY: number) => void;
    onTap?: (x: number, y: number, event: PointerEvent) => void;
    onWheel?: (delta: number, event: WheelEvent) => void;
}
export interface PointerGestureOptions {
    tapThresholdMs?: number;
    tapMovePx?: number;
}
export type QualityTier = 'mobile' | 'desktop' | 'highEnd';
export type PostEffectName = 'bloom' | 'dof' | 'godRays' | 'filmGrain' | 'glitch';
export interface QualityPreset {
    pixelRatio: number;
    shadowMapSize: number;
    shadowsEnabled: boolean;
    postFx: PostEffectName[];
    chunkViewRadius: number;
    particleBudget: number;
    maxLights: number;
}
export interface QualitySettings extends QualityPreset {
    tier: QualityTier;
}
/**
 * Seeded pseudo-random stream. `fork(label)` derives a deterministic
 * sub-stream from a label hash — the determinism lesson: seed once, fork per
 * consumer so build order and undo/redo replay never change the output.
 */
export interface SeededRng {
    next(): number;
    range(min: number, max: number): number;
    int(minInclusive: number, maxInclusive: number): number;
    pick<T>(items: readonly T[]): T;
    fork(label: string): SeededRng;
}
/**
 * Context injected into every scene module. Modules never reach for globals —
 * this kills init-order bugs and keeps modules testable headless.
 */
export interface SceneContext {
    scene: THREE.Scene;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    rng: SeededRng;
    loop: FrameLoop;
    ground?: THREE.Object3D;
    materials?: MaterialPoolLike;
    models?: Record<string, THREE.Object3D>;
}
/**
 * A self-contained scene feature. `build` receives the {@link SceneContext};
 * `dispose` frees only what the module created (never shared/pooled resources).
 */
export interface SceneModule {
    name: string;
    build(ctx: SceneContext): void;
    dispose(): void;
}
/**
 * Minimal structural type for a material pool, so {@link SceneContext} can
 * reference one without importing the concrete class.
 */
export interface MaterialPoolLike {
    get<T extends THREE.Material>(key: string, factory: () => T): T;
}
/** A parameter specification used to coerce config- or LLM-driven content. */
export type ParamSpec = {
    kind: 'number';
    default: number;
    min?: number;
    max?: number;
} | {
    kind: 'int';
    default: number;
    min?: number;
    max?: number;
} | {
    kind: 'boolean';
    default: boolean;
} | {
    kind: 'string';
    default: string;
} | {
    kind: 'enum';
    default: string;
    options: readonly string[];
};
export type ParamValue = number | boolean | string;
export type ParamSpecMap = Record<string, ParamSpec>;
/** Normalized result of loading a model file (glTF and friends). */
export interface LoadedModel {
    scene: THREE.Object3D;
    animations: THREE.AnimationClip[];
    cameras: THREE.Camera[];
    asset?: unknown;
}
export interface PlayOptions {
    loop?: THREE.AnimationActionLoopStyles;
    fadeIn?: number;
    reset?: boolean;
    clampWhenFinished?: boolean;
    timeScale?: number;
}
/**
 * Wraps an AnimationMixer + its actions. `tick(ctx)` advances by ctx.delta;
 * when built with a FrameLoop it auto-registers so playback follows the render
 * loop. `dispose` uncaches the root and unregisters the tick.
 */
export interface AnimationController extends Disposable {
    mixer: THREE.AnimationMixer;
    actions: Map<string, THREE.AnimationAction>;
    play(name: string, options?: PlayOptions): THREE.AnimationAction | null;
    crossfade(from: string, to: string, duration?: number): void;
    stop(name?: string): void;
    tick(ctx: FrameContext): void;
}
/** Minimal context a prop needs to build + animate itself. SceneContext satisfies it. */
export interface PropContext {
    rng?: SeededRng;
    loop?: FrameLoop;
}
export type InstancePlaceFn = (index: number, rng: () => number, object: THREE.Object3D, color: THREE.Color) => void;
/**
 * Declarative description of a reusable prop: how to build its Object3D, plus
 * optional animation clips, embedded lights, and an instancing hint. Author one
 * with `defineProp` and mount it with `createProp` (or via <Prop src>).
 */
export interface PropDefinition {
    name: string;
    build(ctx: PropContext): THREE.Object3D;
    clips?(root: THREE.Object3D): THREE.AnimationClip[];
    lights?(root: THREE.Object3D): THREE.Light[];
    instanced?: {
        count: number;
        radius?: number;
        seed?: number;
        place?: InstancePlaceFn;
    };
}
export type PropFactory = PropDefinition;
/** A live, mounted prop. `dispose` frees geometry/materials/controller it owns. */
export interface PropInstance extends Disposable {
    object: THREE.Object3D;
    controller?: AnimationController;
    lights: THREE.Light[];
}
//# sourceMappingURL=types.d.ts.map