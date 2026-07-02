import * as THREE from 'three';
import type { Vec3Tuple } from './targets.js';
import type { FrameContext } from '../types.js';
export type CameraMode = 'free' | 'flyTo' | 'follow' | 'cockpit';
export interface CameraBounds {
    min: Vec3Tuple;
    max: Vec3Tuple;
}
export interface CameraControllerOptions {
    /** Position easing rate (higher = snappier). */
    stiffness?: number;
    lookStiffness?: number;
    fovStiffness?: number;
    /** Distance at which a fly-to counts as arrived. */
    arriveEpsilon?: number;
    bounds?: CameraBounds | null;
}
export interface FlyToOptions {
    speed?: number;
    fov?: number;
    onArrive?: () => void;
}
export interface CameraController {
    readonly camera: THREE.PerspectiveCamera;
    mode(): CameraMode;
    /** Ease toward a position + look-at; fires onArrive once, then goes free. */
    flyTo(position: Vec3Tuple, lookAt: Vec3Tuple, options?: FlyToOptions): void;
    /** Track an object, keeping `offset` in its local frame. */
    follow(object: THREE.Object3D, offset?: Vec3Tuple): void;
    /** Anchor to a rig Object3D (first-person): copies its world transform. */
    cockpit(rig: THREE.Object3D): void;
    free(): void;
    setFov(fov: number): void;
    setBounds(bounds: CameraBounds | null): void;
    snapTo(position: Vec3Tuple, lookAt: Vec3Tuple): void;
    isMoving(): boolean;
    update(ctx: FrameContext): void;
}
export declare function createCameraController(camera: THREE.PerspectiveCamera, { stiffness, lookStiffness, fovStiffness, arriveEpsilon, bounds, }?: CameraControllerOptions): CameraController;
//# sourceMappingURL=camera-controller.d.ts.map