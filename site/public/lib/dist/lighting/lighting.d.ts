import * as THREE from 'three';
import type { Disposable } from '../types.js';
export interface EnvironmentOptions {
    intensity?: number;
    envScene?: THREE.Scene;
}
export declare function applyEnvironment(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { intensity, envScene }?: EnvironmentOptions): THREE.Texture;
export interface SunOptions {
    color?: THREE.ColorRepresentation;
    intensity?: number;
    position?: THREE.Vector3;
    shadowMapSize?: number;
    shadowFrustum?: number;
    shadowFar?: number;
}
export declare function createSun({ color, intensity, position, shadowMapSize, shadowFrustum, shadowFar, }?: SunOptions): THREE.DirectionalLight;
export interface HemisphereFillOptions {
    skyColor?: THREE.ColorRepresentation;
    groundColor?: THREE.ColorRepresentation;
    intensity?: number;
}
export declare function createHemisphereFill({ skyColor, groundColor, intensity, }?: HemisphereFillOptions): THREE.HemisphereLight;
export interface StandardLightingOptions {
    env?: EnvironmentOptions;
    sun?: SunOptions;
    hemi?: HemisphereFillOptions;
}
export interface StandardLighting extends Disposable {
    env: THREE.Texture;
    sun: THREE.DirectionalLight;
    hemi: THREE.HemisphereLight;
}
export declare function setupStandardLighting(scene: THREE.Scene, renderer: THREE.WebGLRenderer, options?: StandardLightingOptions): StandardLighting;
//# sourceMappingURL=lighting.d.ts.map