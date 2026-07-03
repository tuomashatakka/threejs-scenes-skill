import * as THREE from 'three';
import type { App, AppOptions } from '../core/app.js';
import type { IsoCameraOptions } from '../camera/iso-camera.js';
import type { InfiniteGround, InfiniteGroundOptions } from '../geometry/infinite-ground.js';
import type { StateSource } from '../state/controller.js';
import type { Disposable } from '../types.js';
export interface IsoScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'camera' | 'orbit' | 'state'>, IsoCameraOptions {
    /** Plain object, store, or controller — external controllers stay bound. */
    state?: StateSource<S>;
    /** Drag panning in the ground plane. Default true. */
    pan?: boolean;
    /** viewSize clamp for pinch/wheel zoom. Default [6, 80]; false disables zoom. */
    zoom?: readonly [number, number] | false;
    /** Recentering tiled terrain following the pan focus. Off by default. */
    ground?: InfiniteGroundOptions;
}
export interface IsoScaffold<S extends object> extends Disposable {
    app: App<S>;
    camera: THREE.OrthographicCamera;
    /** The pan focus in the ground plane — tiles recenter around it. */
    focus: THREE.Vector3;
    ground: InfiniteGround | null;
}
export declare function createIsoScaffold<S extends object = Record<string, unknown>>({ state, viewSize, flavor, near, far, pan, zoom, ground: groundOptions, ...appOptions }: IsoScaffoldOptions<S>): IsoScaffold<S>;
//# sourceMappingURL=iso.d.ts.map