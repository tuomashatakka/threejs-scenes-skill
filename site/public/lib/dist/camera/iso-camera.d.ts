import * as THREE from 'three';
export type IsoFlavor = 'true-iso' | 'dimetric';
export interface IsoCameraOptions {
    viewSize?: number;
    flavor?: IsoFlavor;
    near?: number;
    far?: number;
}
export declare function createIsoCamera(aspect: number, { viewSize, flavor, near, far, }?: IsoCameraOptions): THREE.OrthographicCamera;
export declare function resizeIsoCamera(camera: THREE.OrthographicCamera, aspect: number): void;
//# sourceMappingURL=iso-camera.d.ts.map