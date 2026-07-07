import * as THREE from 'three';
export type PickFilter = (object: THREE.Object3D) => boolean;
export interface PickResult {
    object: THREE.Object3D;
    topLevel: THREE.Object3D;
    point: THREE.Vector3;
    distance: number;
}
export declare function pickTopLevel(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, isPickable?: PickFilter): PickResult | null;
export interface PickOptions {
    isPickable?: PickFilter;
    /**
     * Screen-space distortion inverse, applied to the pointer NDC before the
     * raycast — required when a warping post pass (CRT curvature) is active so
     * hits match what's on screen. See post/webgl/crt.ts crtCorrectPointer.
     */
    distortion?: (ndcX: number, ndcY: number) => {
        x: number;
        y: number;
    };
    /** Restrict the cast to these roots instead of the whole scene. */
    objects?: THREE.Object3D[];
}
/** pickTopLevel with a distortion hook + object scoping. */
export declare function pick(scene: THREE.Scene, camera: THREE.Camera, ndcX: number, ndcY: number, { isPickable, distortion, objects }?: PickOptions): PickResult | null;
/**
 * Click-vs-drag discrimination: remembers pointerdown, reports a click only
 * when pointerup lands within `thresholdPx`.
 */
type CreateClickGuardReturnType = {
    down(x: number, y: number): void;
    isClick(x: number, y: number): boolean;
};
export declare function createClickGuard(thresholdPx?: number): CreateClickGuardReturnType;
export {};
//# sourceMappingURL=pick.d.ts.map