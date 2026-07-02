import * as THREE from 'three';
import type { Clock } from './clock.js';
import type { Store, Reducer } from './state.js';
import type { RendererOptions } from './renderer.js';
import type { FrameContext, SceneContext, Disposable } from '../types.js';
/**
 * A scene feature in the unidirectional flow. `build` creates objects once;
 * `update` projects the current state onto them every simulation tick. Modules
 * read state — they never write it back.
 */
export interface AppModule<S extends object = Record<string, unknown>> {
    name: string;
    build(ctx: SceneContext): void;
    update?(state: S, frame: FrameContext, ctx: SceneContext): void;
    dispose(): void;
}
export interface AppCameraOptions {
    fov?: number;
    near?: number;
    far?: number;
    position?: readonly [number, number, number];
    lookAt?: readonly [number, number, number];
}
export interface AppOptions<S extends object, A = Partial<S>> {
    canvas: HTMLCanvasElement;
    /** Initial serializable app state. Defaults to an empty object. */
    state?: S;
    reducer?: Reducer<S, A>;
    seed?: number;
    /** Injectable time source. Pass createClock({ mode: 'fixed' }) for determinism. */
    clock?: Clock;
    renderer?: Omit<RendererOptions, 'canvas'>;
    camera?: AppCameraOptions;
    background?: THREE.ColorRepresentation;
    /** Standard three-light rig. Default true. */
    lighting?: boolean;
    /** Built-in pointer orbit. Default true; disable when using a camera controller. */
    orbit?: boolean;
    modules?: AppModule<S>[];
    /** Runs after module updates, before render — the place for app-level per-frame glue. */
    onFrame?: (state: S, frame: FrameContext, ctx: SceneContext) => void;
}
export interface App<S extends object, A = Partial<S>> extends Disposable {
    ctx: SceneContext;
    store: Store<S, A>;
    getState(): S;
    setState(patch: Partial<S>): void;
    dispatch(action: A): void;
    /** Advance the simulation by `realDelta` seconds (default: one clock step) and render. */
    tick(realDelta?: number): void;
    start(): void;
    stop(): void;
}
export declare function createApp<S extends object = Record<string, unknown>, A = Partial<S>>({ canvas, state, reducer, seed, clock, renderer: rendererOptions, camera: cameraOptions, background, lighting, orbit, modules, onFrame, }: AppOptions<S, A>): App<S, A>;
//# sourceMappingURL=app.d.ts.map