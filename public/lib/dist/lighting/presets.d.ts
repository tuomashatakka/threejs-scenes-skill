import * as THREE from 'three';
import type { Disposable } from '../types.js';
export type LightingPresetName = 'dramatic' | 'studio' | 'soft' | 'neon' | 'sunset';
export interface LightingConfig {
    background: number;
    exposure: number;
    fog: [number, number];
    hemi: [number, number, number];
    key: [number, number, [number, number, number]];
    rim: [number, number, [number, number, number]];
    accent: [number, number, [number, number, number]];
    /** Optional narrow theatrical spotlight: colour, intensity, position, cone angle (rad). */
    spot?: [number, number, [number, number, number], number];
    /** Optional pair of visible cone-shaped beams converging on the origin: colour, intensity. */
    beams?: [number, number];
}
export declare const LIGHTING_PRESETS: Record<LightingPresetName, LightingConfig>;
export interface LightingRigOptions {
    /** Initial preset. Default: 'studio'. */
    preset?: LightingPresetName;
    /** Cast shadows from the key light. Default: true. */
    shadows?: boolean;
    /** Extra presets merged over the built-ins. */
    presets?: Record<string, LightingConfig>;
}
export interface LightingRig extends Disposable {
    hemi: THREE.HemisphereLight;
    key: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    accent: THREE.PointLight;
    spot: THREE.SpotLight;
    cones: THREE.Mesh[];
    /** Retune every light (and scene bg/fog/exposure) to a named preset. */
    setPreset(name: LightingPresetName | string): void;
}
export declare function createLightingRig(scene: THREE.Scene, renderer: THREE.WebGLRenderer, { preset, shadows, presets }?: LightingRigOptions): LightingRig;
//# sourceMappingURL=presets.d.ts.map