// lib/procedural/noise.ts
// Seeded 3D simplex noise + fbm/ridged fractal sums (CPU). Classic Gustavson
// simplex with a seed-shuffled permutation table so the field is deterministic
// per seed. Powers procedural/body.ts displacement and any CPU terrain.
import { mulberry32 } from './rng.js';
const GRAD3 = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
];
export function createNoise3D(seed = 1) {
    // seed-shuffled permutation table (Fisher-Yates over 0..255, doubled)
    const rng = mulberry32(seed >>> 0);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++)
        p[i] = i;
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = p[i];
        p[i] = p[j];
        p[j] = t;
    }
    const perm = new Uint8Array(512);
    for (let i = 0; i < 512; i++)
        perm[i] = p[i & 255];
    const F3 = 1 / 3;
    const G3 = 1 / 6;
    function dot3(g, x, y, z) {
        return g[0] * x + g[1] * y + g[2] * z;
    }
    function sample(xin, yin, zin) {
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);
        const t = (i + j + k) * G3;
        const x0 = xin - (i - t);
        const y0 = yin - (j - t);
        const z0 = zin - (k - t);
        let i1 = 0, j1 = 0, k1 = 0;
        let i2 = 0, j2 = 0, k2 = 0;
        if (x0 >= y0)
            if (y0 >= z0) {
                i1 = 1;
                i2 = 1;
                j2 = 1;
            }
            else if (x0 >= z0) {
                i1 = 1;
                i2 = 1;
                k2 = 1;
            }
            else {
                k1 = 1;
                i2 = 1;
                k2 = 1;
            }
        else if (y0 < z0) {
            k1 = 1;
            j2 = 1;
            k2 = 1;
        }
        else if (x0 < z0) {
            j1 = 1;
            j2 = 1;
            k2 = 1;
        }
        else {
            j1 = 1;
            i2 = 1;
            j2 = 1;
        }
        const x1 = x0 - i1 + G3;
        const y1 = y0 - j1 + G3;
        const z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2 * G3;
        const y2 = y0 - j2 + 2 * G3;
        const z2 = z0 - k2 + 2 * G3;
        const x3 = x0 - 1 + 3 * G3;
        const y3 = y0 - 1 + 3 * G3;
        const z3 = z0 - 1 + 3 * G3;
        const ii = i & 255;
        const jj = j & 255;
        const kk = k & 255;
        let n = 0;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 > 0) {
            t0 *= t0;
            const gi = perm[ii + perm[jj + perm[kk]]] % 12;
            n += t0 * t0 * dot3(GRAD3[gi], x0, y0, z0);
        }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 > 0) {
            t1 *= t1;
            const gi = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]]] % 12;
            n += t1 * t1 * dot3(GRAD3[gi], x1, y1, z1);
        }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 > 0) {
            t2 *= t2;
            const gi = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]]] % 12;
            n += t2 * t2 * dot3(GRAD3[gi], x2, y2, z2);
        }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 > 0) {
            t3 *= t3;
            const gi = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]]] % 12;
            n += t3 * t3 * dot3(GRAD3[gi], x3, y3, z3);
        }
        return 32 * n;
    }
    function fbm(x, y, z, octaves = 4, lacunarity = 2, gain = 0.5) {
        let sum = 0;
        let amp = 0.5;
        let freq = 1;
        for (let o = 0; o < octaves; o++) {
            sum += amp * sample(x * freq, y * freq, z * freq);
            freq *= lacunarity;
            amp *= gain;
        }
        return sum;
    }
    function ridged(x, y, z, octaves = 4, lacunarity = 2, gain = 0.5) {
        let sum = 0;
        let amp = 0.5;
        let freq = 1;
        for (let o = 0; o < octaves; o++) {
            sum += amp * (1 - Math.abs(sample(x * freq, y * freq, z * freq)));
            freq *= lacunarity;
            amp *= gain;
        }
        return sum;
    }
    return { sample, fbm, ridged };
}
// perf: medium. ~4 gradient dots per sample; fbm multiplies by octave count.
// Displace geometry at build time, not per frame.
//# sourceMappingURL=noise.js.map