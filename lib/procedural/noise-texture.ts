// lib/procedural/noise-texture.ts
// Generate a seamless tileable noise texture as a DataTexture, sampled on a
// torus surface for perfect tiling. Ported from scripts/noise-texture.js, but
// the simplex-noise dependency is replaced with a self-contained seeded
// value-noise (smoothstep-interpolated lattice) so the package has no extra
// deps. DOM-guarded: returns null in a headless runner.

import * as THREE from 'three'
import { mulberry32, smoothstep } from './rng.js'


function makeValueNoise3D (seed: number): (x: number, y: number, z: number) => number {
  const rng       = mulberry32(seed)
  const PERM_SIZE = 256
  const grad      = new Float32Array(PERM_SIZE)
  for (let i = 0; i < PERM_SIZE; i++)
    grad[i] = rng() * 2 - 1

  const hash = (ix: number, iy: number, iz: number): number => {
    const h = (Math.imul(ix, 73856093) ^ Math.imul(iy, 19349663) ^ Math.imul(iz, 83492791)) >>> 0
    return grad[h % PERM_SIZE] as number
  }

  return (x, y, z) => {
    const x0   = Math.floor(x)
    const y0   = Math.floor(y)
    const z0   = Math.floor(z)
    const fx   = smoothstep(0, 1, x - x0)
    const fy   = smoothstep(0, 1, y - y0)
    const fz   = smoothstep(0, 1, z - z0)
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t
    const c000 = hash(x0, y0, z0)
    const c100 = hash(x0 + 1, y0, z0)
    const c010 = hash(x0, y0 + 1, z0)
    const c110 = hash(x0 + 1, y0 + 1, z0)
    const c001 = hash(x0, y0, z0 + 1)
    const c101 = hash(x0 + 1, y0, z0 + 1)
    const c011 = hash(x0, y0 + 1, z0 + 1)
    const c111 = hash(x0 + 1, y0 + 1, z0 + 1)
    const x00  = lerp(c000, c100, fx)
    const x10  = lerp(c010, c110, fx)
    const x01  = lerp(c001, c101, fx)
    const x11  = lerp(c011, c111, fx)
    const y0v  = lerp(x00, x10, fy)
    const y1v  = lerp(x01, x11, fy)
    return lerp(y0v, y1v, fz)
  }
}

/** Options for {@link createNoiseTexture}: texture `size`, noise frequency/octaves/seed, and which `channels` get independent noise. */
export interface NoiseTextureOptions {
  size?:      number
  frequency?: number
  octaves?:   number
  seed?:      number
  channels?:  string
}

/**
 * Seamlessly tileable seeded noise as a `DataTexture` — the noise is sampled
 * on a torus surface, so opposite edges match exactly.
 *
 * @param options - Size (default 256), frequency, octaves, seed, channels.
 * @returns The texture, or `null` in DOM-less runtimes (degrade to flat
 * colour instead of crashing).
 */
export function createNoiseTexture ({
  size = 256,
  frequency = 4,
  octaves = 4,
  seed = 1,
  channels = 'rgba',
}: NoiseTextureOptions = {}): THREE.DataTexture | null {
  // DOM-guard: degrade to null (flat colour) instead of crashing headless.
  if (typeof document === 'undefined')
    return null

  const noise = makeValueNoise3D(seed)
  const data  = new Float32Array(size * size * 4)

  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let total = 0
      let amp   = 1
      let freq  = frequency
      let norm  = 0
      // toroidal sampling for seamless wrapping
      for (let o = 0; o < octaves; o++) {
        const angleU = u * Math.PI * 2
        const angleV = v * Math.PI * 2
        total += amp * noise(
          Math.cos(angleU) * freq, Math.sin(angleU) * freq,
          Math.cos(angleV) * freq,
        )
        total += amp * 0.5 * noise(
          Math.cos(angleU) * freq * 1.7, Math.sin(angleV) * freq * 1.7,
          Math.cos(angleU + angleV) * freq * 1.3,
        )
        norm += amp * 1.5
        amp *= 0.5
        freq *= 2
      }

      const i     = (y * size + x) * 4
      const v01   = total / norm * 0.5 + 0.5
      data[i + 0] = v01
      data[i + 1] = channels.length >= 2 ? v01 : 0
      data[i + 2] = channels.length >= 3 ? v01 : 0
      data[i + 3] = 1
    }

  const texture       = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.wrapS       = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter   = THREE.LinearFilter
  texture.magFilter   = THREE.LinearFilter
  texture.colorSpace  = THREE.NoColorSpace
  texture.needsUpdate = true
  return texture
}

// perf: cheap once generated. Generation is O(size² × octaves).
// Memory: 16 bytes per pixel (RGBA float). 256² = 256 KB.
