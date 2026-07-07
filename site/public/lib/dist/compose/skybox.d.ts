import * as THREE from 'three';
import type { Disposable } from '../types.js';
export interface GradientSkyOptions {
    top: THREE.ColorRepresentation;
    bottom: THREE.ColorRepresentation;
    /** Curve of the blend: 1 = linear, >1 pushes the horizon color up. Default 1.5. */
    exponent?: number;
}
export interface SkyboxOptions {
    /** Flat background color. */
    color?: THREE.ColorRepresentation;
    /** Procedural vertical-gradient dome. */
    gradient?: GradientSkyOptions;
    /** Equirectangular panorama — a texture, or a URL (DOM only). */
    equirect?: THREE.Texture | string;
    /** Cube map — a CubeTexture, or six face URLs +x,-x,+y,-y,+z,-z (DOM only). */
    cube?: THREE.CubeTexture | string[];
    /** Also assign the texture as scene.environment for IBL. Default false. */
    environment?: boolean;
    /** Gradient dome radius. Keep inside the camera far plane. Default 400. */
    radius?: number;
}
export interface Skybox extends Disposable {
    /** The gradient dome mesh, when the gradient mode is active. */
    object: THREE.Object3D | null;
}
export declare function createSkybox(scene: THREE.Scene, { color, gradient, equirect, cube, environment, radius, }: SkyboxOptions): Skybox;
//# sourceMappingURL=skybox.d.ts.map