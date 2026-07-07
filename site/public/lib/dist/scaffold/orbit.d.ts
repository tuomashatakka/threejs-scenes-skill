import * as THREE from 'three';
import type { App, AppOptions } from '../core/app.js';
import type { StateSource } from '../state/controller.js';
import type { Disposable } from '../types.js';
export interface OrbitScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'state'> {
    state?: StateSource<S>;
    /** Turntable speed in radians/second. Default 0 (off). */
    autoRotate?: number;
}
export interface OrbitScaffold<S extends object> extends Disposable {
    app: App<S>;
    /** Auto-rotating content root — add viewer content here. */
    stage: THREE.Group;
    /** Frame an object: distance the camera so it fits with `margin` headroom. */
    fitTo(object: THREE.Object3D, margin?: number): void;
}
export declare function createOrbitScaffold<S extends object = Record<string, unknown>>({ state, autoRotate, ...appOptions }: OrbitScaffoldOptions<S>): OrbitScaffold<S>;
//# sourceMappingURL=orbit.d.ts.map