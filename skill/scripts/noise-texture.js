// scripts/noise-texture.js
// Generate a seamless tileable noise texture as a DataTexture. Uses 3D simplex
// noise sampled on a torus surface for perfect tiling.

import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

import { mulberry32 } from './rng.js'

export function createNoiseTexture ({
  size = 256,
  frequency = 4,
  octaves = 4,
  seed = 1,
  channels = 'rgba',
} = {}) {
  const noise = createNoise3D(mulberry32(seed))
  const data = new Float32Array(size * size * 4)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size
      const v = y / size
      let total = 0
      let amp = 1
      let freq = frequency
      let norm = 0
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
      const i = (y * size + x) * 4
      const v01 = (total / norm) * 0.5 + 0.5
      data[i + 0] = v01
      data[i + 1] = channels.length >= 2 ? v01 : 0
      data[i + 2] = channels.length >= 3 ? v01 : 0
      data[i + 3] = 1
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.FloatType)
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping
  texture.minFilter = THREE.LinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.colorSpace = THREE.NoColorSpace
  texture.needsUpdate = true
  return texture
}

// perf: cheap once generated. Generation is O(size² × octaves).
// Memory: 16 bytes per pixel (RGBA float). 256² = 256 KB.
