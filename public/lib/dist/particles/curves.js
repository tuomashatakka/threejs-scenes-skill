// lib/particles/curves.ts
// Over-lifetime curves for particle attributes. A curve is a list of
// [t, value] stops on t = 0..1 (normalized particle age). Curves are sampled
// into small LUTs once at emitter build time — the per-frame cost is a texture
// fetch, never a JS evaluation.
import * as THREE from 'three';
/**
 * Sample a scalar curve at t. Linear interpolation between stops — chosen over
 * smoothstep/Catmull-Rom because stops are author-controlled: add a stop where
 * you want an ease, and the LUT resolution (64) hides the corners anyway.
 */
export function sampleCurve(curve, t) {
    const first = curve[0];
    const last = curve[curve.length - 1];
    if (!first || !last)
        return 1;
    if (t <= first[0])
        return first[1];
    if (t >= last[0])
        return last[1];
    for (let i = 1; i < curve.length; i++) {
        const b = curve[i];
        if (t > b[0])
            continue;
        const a = curve[i - 1];
        const span = b[0] - a[0];
        const k = span > 0 ? (t - a[0]) / span : 0;
        return a[1] + (b[1] - a[1]) * k;
    }
    return last[1];
}
/** Bake a scalar curve into a Float32Array LUT of `resolution` samples. */
export function bakeCurve(curve, resolution = 64) {
    const out = new Float32Array(resolution);
    for (let i = 0; i < resolution; i++)
        out[i] = sampleCurve(curve, i / (resolution - 1));
    return out;
}
const scratch = new THREE.Color();
/**
 * Bake color + alpha + size curves into one 2-row RGBA DataTexture:
 * row 0 = rgb: color, a: alpha; row 1 = r: size. Sampled in the particle
 * shaders by normalized age.
 */
export function bakeCurveTexture(color, alpha, size, resolution = 64) {
    const data = new Float32Array(resolution * 2 * 4);
    for (let i = 0; i < resolution; i++) {
        const t = i / (resolution - 1);
        // row 0: color + alpha
        let stopIndex = color.length - 1;
        for (let s = 0; s < color.length; s++) {
            const stop = color[s];
            if (stop[0] >= t) {
                stopIndex = s;
                break;
            }
        }
        const b = color[stopIndex];
        const a = color[Math.max(0, stopIndex - 1)];
        const span = b[0] - a[0];
        const k = span > 0 ? Math.min(1, Math.max(0, (t - a[0]) / span)) : t >= b[0] ? 1 : 0;
        const ca = toColor(a[1]);
        const cb = toColor(b[1]);
        data[i * 4 + 0] = ca[0] + (cb[0] - ca[0]) * k;
        data[i * 4 + 1] = ca[1] + (cb[1] - ca[1]) * k;
        data[i * 4 + 2] = ca[2] + (cb[2] - ca[2]) * k;
        data[i * 4 + 3] = sampleCurve(alpha, t);
        // row 1: size
        data[(resolution + i) * 4 + 0] = sampleCurve(size, t);
    }
    const texture = new THREE.DataTexture(data, resolution, 2, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.needsUpdate = true;
    return texture;
}
function toColor(value) {
    if (typeof value === 'string') {
        scratch.set(value);
        return [scratch.r, scratch.g, scratch.b];
    }
    return value;
}
// perf: cheap. baked once per emitter; sampling in-shader is one LUT fetch.
//# sourceMappingURL=curves.js.map