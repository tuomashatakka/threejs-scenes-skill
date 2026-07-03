import * as THREE from 'three';
import type { App, AppOptions } from '../core/app.js';
import type { StateSource } from '../state/controller.js';
import type { Vec3Tuple } from '../camera/targets.js';
import type { Disposable } from '../types.js';
export interface TppScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'orbit' | 'state'> {
    state?: StateSource<S>;
    /** Object to chase; can also be set later with setTarget. */
    target?: THREE.Object3D;
    /** Camera offset in the target's local frame. Default [0, 3, -6]. */
    offset?: Vec3Tuple;
    /** Look-at point offset ahead of the target. Default [0, 1, 4]. */
    lookAhead?: Vec3Tuple;
    stiffness?: number;
    rotationStiffness?: number;
}
export interface TppScaffold<S extends object> extends Disposable {
    app: App<S>;
    setTarget(target: THREE.Object3D | null): void;
}
export declare function createTppScaffold<S extends object = Record<string, unknown>>({ state, target, offset, lookAhead, stiffness, rotationStiffness, ...appOptions }: TppScaffoldOptions<S>): TppScaffold<S>;
//# sourceMappingURL=tpp.d.ts.map