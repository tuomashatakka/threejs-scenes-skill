import * as THREE from 'three';
import type { CameraController } from './camera-controller.js';
export interface FollowCameraOptions {
    offset: THREE.Vector3;
    lookAhead?: THREE.Vector3;
    stiffness?: number;
    rotationStiffness?: number;
}
export declare function createFollowCamera(camera: THREE.Camera, target: THREE.Object3D, { offset, lookAhead, stiffness, rotationStiffness, }: FollowCameraOptions): CameraController;
//# sourceMappingURL=follow-camera.d.ts.map