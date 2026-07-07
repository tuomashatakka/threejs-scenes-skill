import * as THREE from 'three';
export type StandardPresetName = 'metal' | 'chrome' | 'gold' | 'plastic' | 'rubber' | 'glass' | 'matte' | 'emissive';
export declare const MATERIAL_PRESETS: Record<StandardPresetName, THREE.MeshStandardMaterialParameters>;
/**
 * Build a PBR material from a preset name (or raw params), merged with optional
 * overrides. The `glass` preset returns a MeshPhysicalMaterial with transmission
 * so it actually refracts; everything else is a MeshStandardMaterial.
 */
export declare function createStandardMaterial(presetOrParams?: StandardPresetName | THREE.MeshStandardMaterialParameters, overrides?: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial;
/** Quantized gradient ramp for cel shading — NearestFilter keeps the bands hard. */
export declare function createGradientToonMap(steps?: number): THREE.DataTexture;
export interface ToonOptions {
    color?: THREE.ColorRepresentation;
    steps?: number;
}
export declare function createToonMaterial(options?: ToonOptions): THREE.MeshToonMaterial;
/**
 * Matcap material. Pass a loaded THREE.Texture, or a URL string (loaded via
 * TextureLoader — browser only; headless the matcap is simply left unset).
 */
export declare function createMatcapMaterial(matcap?: THREE.Texture | string): THREE.MeshMatcapMaterial;
//# sourceMappingURL=presets.d.ts.map