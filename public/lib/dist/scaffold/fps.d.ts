import * as THREE from 'three';
import type { App, AppOptions } from '../core/app.js';
import type { StateSource } from '../state/controller.js';
import type { Disposable } from '../types.js';
export interface FpsScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'orbit' | 'state'> {
    state?: StateSource<S>;
    /** Movement speed, units/second. Default 5. */
    speed?: number;
    /** Radians of yaw/pitch per pixel of pointer movement. Default 0.0022. */
    lookSpeed?: number;
    /** Camera height above the ground. Default 1.7. */
    eyeHeight?: number;
    /** Request pointer lock on canvas click. Default true (drag-look otherwise). */
    pointerLock?: boolean;
    /** Veto/adjust movement: return the corrected position, or null to block. */
    collide?: (next: THREE.Vector3, previous: THREE.Vector3) => THREE.Vector3 | null;
    /** Terrain height under (x, z); eyeHeight rides on top of it. */
    groundHeight?: (x: number, z: number) => number;
}
export interface FpsScaffold<S extends object> extends Disposable {
    app: App<S>;
    /** Current yaw/pitch, readable for HUDs or minimap needles. */
    orientation(): {
        yaw: number;
        pitch: number;
    };
}
export declare function createFpsScaffold<S extends object = Record<string, unknown>>({ state, speed, lookSpeed, eyeHeight, pointerLock, collide, groundHeight, ...appOptions }: FpsScaffoldOptions<S>): FpsScaffold<S>;
//# sourceMappingURL=fps.d.ts.map