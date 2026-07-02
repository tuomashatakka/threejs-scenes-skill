import * as THREE from 'three';
import type { Disposable, FrameContext } from '../types.js';
export interface PathCameraOptions {
    /** Max look-around yaw in radians. Default 0.25 (~14°). */
    yawRange?: number;
    /** Max look-around pitch in radians. Default 0.18. */
    pitchRange?: number;
    /** Look smoothing rate (higher = snappier). Default 6. */
    smoothing?: number;
    /** Units per second along the curve. Default 2. */
    speed?: number;
}
export interface PathCameraSource {
    /** Current path curve. May be swapped/rebuilt between frames. */
    curve: THREE.Curve<THREE.Vector3> & {
        points?: THREE.Vector3[];
    };
    /** Total path length in world units. */
    total: number;
}
export interface PathCamera extends Disposable {
    /** Distance travelled along the curve (writable for seeking). */
    distance: number;
    /** Advance and orient the camera. Call once per frame. */
    update(ctx: FrameContext, speedOverride?: number): void;
}
export declare function createPathCamera(camera: THREE.PerspectiveCamera, path: PathCameraSource, element: HTMLElement, { yawRange, pitchRange, smoothing, speed }?: PathCameraOptions): PathCamera;
//# sourceMappingURL=path-camera.d.ts.map