import type * as THREE from 'three';
import type { Disposable, FrameContext, SceneContext } from '../types.js';
/**
 * One "view" of the app (a whole sub-scene). `update` advances animation;
 * `updateState` projects app state onto objects; `setActive` toggles
 * visibility/attachment when the view is entered/left.
 */
export interface ViewRenderer<S = unknown> extends Disposable {
    update?(frame: FrameContext): void;
    updateState?(state: S): void;
    getInteractiveObjects?(): THREE.Object3D[];
    setActive?(active: boolean): void;
}
export interface ViewRegistryOptions<S> {
    create(key: string, ctx: SceneContext): ViewRenderer<S>;
    /** Max cached renderers (including the active one). Default 4. */
    limit?: number;
}
export interface ViewRegistry<S = unknown> extends Disposable {
    /** Get-or-create the renderer for `key`, make it active, LRU-evict overflow. */
    activate(key: string, ctx: SceneContext): ViewRenderer<S>;
    active(): ViewRenderer<S> | null;
    activeKey(): string | null;
    get(key: string): ViewRenderer<S> | undefined;
    /** Tick the ACTIVE renderer only. */
    update(frame: FrameContext): void;
    updateState(state: S): void;
}
export declare function createViewRegistry<S = unknown>({ create, limit }: ViewRegistryOptions<S>): ViewRegistry<S>;
//# sourceMappingURL=view-registry.d.ts.map