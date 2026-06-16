// scripts/procedural-crystal-geometry.js
// Programmatic geometry — a cluster of hexagonal-prism crystal shards.
// Demonstrates the pattern: positions[], normals[], indices[] → BufferAttributes.

import * as THREE from 'three'

import { mulberry32 } from './rng.js'


export function createCrystalGeometry ({
  shardCount = 12,
  heightRange = [ 0.5, 2.0 ],
  radiusRange = [ 0.15, 0.35 ],
  spread = 1.5,
  seed = 1,
} = {}) {
  const rng       = mulberry32(seed)
  const positions = []
  const normals   = []
  const indices   = []

  const pushShard = (ox, oz, height, radius) => {
    const sides     = 6
    const baseIndex = positions.length / 3
    // base ring
    for (let i = 0; i < sides; i++) {
      const a = i / sides * Math.PI * 2
      positions.push(ox + Math.cos(a) * radius, 0, oz + Math.sin(a) * radius)
      normals.push(Math.cos(a), 0, Math.sin(a))
    }
    // apex
    positions.push(ox, height, oz)
    normals.push(0, 1, 0)

    const apex = baseIndex + sides
    for (let i = 0; i < sides; i++)
      indices.push(baseIndex + i, baseIndex + (i + 1) % sides, apex)
  }

  for (let i = 0; i < shardCount; i++) {
    const ox = (rng() - 0.5) * spread * 2
    const oz = (rng() - 0.5) * spread * 2
    const h  = heightRange[0] + rng() * (heightRange[1] - heightRange[0])
    const r  = radiusRange[0] + rng() * (radiusRange[1] - radiusRange[0])
    pushShard(ox, oz, h, r)
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

// perf: cheap. built once, reused.
// Memory: 12 floats per vertex × ~(6+1) verts per shard × shardCount.
