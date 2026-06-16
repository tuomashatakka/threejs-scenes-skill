// lib/materials/presets.ts
// Common starting materials. createStandardMaterial gives you a tuned PBR
// material from a named preset (metal/glass/rubber/…) plus overrides;
// createToonMaterial + createMatcapMaterial cover the two most-asked
// non-photoreal looks. These are starting points — tweak freely.
import * as THREE from 'three';
export const MATERIAL_PRESETS = {
    metal: { color: '#b8c0c8', metalness: 1, roughness: 0.35 },
    chrome: { color: '#ffffff', metalness: 1, roughness: 0.05 },
    gold: { color: '#ffcf6b', metalness: 1, roughness: 0.25 },
    plastic: { color: '#d94f4f', metalness: 0, roughness: 0.5 },
    rubber: { color: '#222428', metalness: 0, roughness: 0.95 },
    glass: { color: '#cfe8ff', metalness: 0, roughness: 0.05 },
    matte: { color: '#9aa7b5', metalness: 0, roughness: 1 },
    emissive: { color: '#000000', emissive: '#79f7ff', emissiveIntensity: 2, roughness: 0.5 },
};
/**
 * Build a PBR material from a preset name (or raw params), merged with optional
 * overrides. The `glass` preset returns a MeshPhysicalMaterial with transmission
 * so it actually refracts; everything else is a MeshStandardMaterial.
 */
export function createStandardMaterial(presetOrParams = 'plastic', overrides = {}) {
    const base = typeof presetOrParams === 'string'
        ? MATERIAL_PRESETS[presetOrParams]
        : presetOrParams;
    const params = { ...base, ...overrides };
    if (typeof presetOrParams === 'string' && presetOrParams === 'glass') {
        return new THREE.MeshPhysicalMaterial({
            transmission: 1,
            thickness: 0.5,
            ior: 1.5,
            ...params,
        });
    }
    return new THREE.MeshStandardMaterial(params);
}
/** Quantized gradient ramp for cel shading — NearestFilter keeps the bands hard. */
export function createGradientToonMap(steps = 4) {
    const data = new Uint8Array(steps);
    for (let i = 0; i < steps; i++)
        data[i] = Math.round((i / (steps - 1)) * 255);
    const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
}
export function createToonMaterial(options = {}) {
    const { color = '#d94f4f', steps = 4 } = options;
    return new THREE.MeshToonMaterial({ color, gradientMap: createGradientToonMap(steps) });
}
/**
 * Matcap material. Pass a loaded THREE.Texture, or a URL string (loaded via
 * TextureLoader — browser only; headless the matcap is simply left unset).
 */
export function createMatcapMaterial(matcap) {
    const material = new THREE.MeshMatcapMaterial();
    if (matcap instanceof THREE.Texture)
        material.matcap = matcap;
    else if (typeof matcap === 'string' && typeof document !== 'undefined')
        material.matcap = new THREE.TextureLoader().load(matcap);
    return material;
}
// perf: cheap to build. Reuse a single material instance across meshes; the
// shader compiles once per unique material. Dispose on teardown.
//# sourceMappingURL=presets.js.map