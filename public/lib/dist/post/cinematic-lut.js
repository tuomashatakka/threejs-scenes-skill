// lib/post/cinematic-lut.ts
// Procedural colour-grading 3D LUT, ported from anime-anima. Hand it to
// three's LUTPass (or the webgpu lut3D node) — no .cube asset to ship.
import * as THREE from 'three';
/**
 * Build a cinematic colour-grading 3D LUT as a `Data3DTexture`: a gentle
 * S-curve for contrast, teal lifted into the shadows and warmth pushed into
 * the highlights (the classic "teal & orange" look), plus a saturation lift.
 */
export function createCinematicLUT(size = 33, { contrast = 1.12, splitTone = 1, saturation = 1.08 } = {}) {
    const data = new Uint8Array(size * size * size * 4);
    const last = size - 1;
    let offset = 0;
    for (let bIndex = 0; bIndex < size; bIndex++)
        for (let gIndex = 0; gIndex < size; gIndex++)
            for (let rIndex = 0; rIndex < size; rIndex++) {
                let r = rIndex / last;
                let g = gIndex / last;
                let b = bIndex / last;
                // Contrast S-curve about mid-grey.
                r = clamp01((r - 0.5) * contrast + 0.5);
                g = clamp01((g - 0.5) * contrast + 0.5);
                b = clamp01((b - 0.5) * contrast + 0.5);
                // Tone-dependent split toning: teal in shadows, amber in highlights.
                const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                const shadow = 1 - lum;
                r = clamp01(r + (lum * 0.05 - shadow * 0.015) * splitTone);
                g = clamp01(g + (lum * 0.02 + shadow * 0.025) * splitTone);
                b = clamp01(b + (-lum * 0.05 + shadow * 0.05) * splitTone);
                // Saturation lift.
                const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b;
                r = clamp01(grey + (r - grey) * saturation);
                g = clamp01(grey + (g - grey) * saturation);
                b = clamp01(grey + (b - grey) * saturation);
                data[offset++] = Math.round(r * 255);
                data[offset++] = Math.round(g * 255);
                data[offset++] = Math.round(b * 255);
                data[offset++] = 255;
            }
    const texture = new THREE.Data3DTexture(data, size, size, size);
    texture.format = THREE.RGBAFormat;
    texture.type = THREE.UnsignedByteType;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.wrapR = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
}
function clamp01(value) {
    return value < 0 ? 0 : value > 1 ? 1 : value;
}
// perf: one-off CPU bake (size³ texels, 33³ ≈ 36k — instant). GPU cost is a
// single 3D texture lookup inside LUTPass.
//# sourceMappingURL=cinematic-lut.js.map