// lib/voxels/greedy-mesh.ts
// Greedy voxel meshing. Merges coplanar same-id faces into max-size rectangles.
// 10-30× fewer triangles than naive 6-quads-per-voxel meshing. Ported from
// scripts/greedy-mesh.js. Algorithm: for each of 3 axes, slice the chunk into
// 2D mask planes per layer, then sweep emitting the largest possible rectangles
// of identical voxel id.

import * as THREE from 'three'

import type { VoxelChunk } from './voxel-data.js'


export function greedyMesh (chunk: VoxelChunk): THREE.BufferGeometry {
  const N                   = chunk.size
  const positions: number[] = []
  const normals: number[]   = []
  const colors: number[]    = []
  const indices: number[]   = []

  for (let dim = 0; dim < 3; dim++) {
    const u    = (dim + 1) % 3
    const v    = (dim + 2) % 3
    const x    = [ 0, 0, 0 ]
    const q    = [ 0, 0, 0 ]
    const mask = new Int32Array(N * N)

    q[dim] = 1
    for (x[dim] = -1; (x[dim] as number) < N;) {
      // build slice mask
      let n = 0
      for (x[v] = 0; (x[v] as number) < N; x[v]++)
        for (x[u] = 0; (x[u] as number) < N; x[u]++) {
          const a = (x[dim] as number) >= 0
            ? chunk.get(x[0] as number, x[1] as number, x[2] as number)
            : 0
          const b = (x[dim] as number) < N - 1
            ? chunk.get(
              (x[0] as number) + (q[0] as number),
              (x[1] as number) + (q[1] as number),
              (x[2] as number) + (q[2] as number),
            )
            : 0
          // mask convention: positive = a-facing, negative = b-facing, 0 = none
          mask[n++] = !!a !== !!b ? a !== 0 ? a : -b : 0
        }
      x[dim]++

      // greedy quad emit
      n = 0
      for (let j = 0; j < N; j++)
        for (let i = 0; i < N;) {
          const m = mask[n] as number
          if (m !== 0) {
          // find run width
            let w = 1
            while (i + w < N && mask[n + w] === m)
              w++

            // find run height
            let h = 1
            outer: for (; j + h < N; h++)
              for (let k = 0; k < w; k++)
                if (mask[n + k + h * N] !== m)
                  break outer

            x[u] = i; x[v] = j

            const du = [ 0, 0, 0 ]
            const dv = [ 0, 0, 0 ]
            if (m > 0) {
              du[u] = w; dv[v] = h
            }
            else {
              du[v] = h; dv[u] = w
            }

            const idBase = positions.length / 3
            const px     = x[0] as number
            const py     = x[1] as number
            const pz     = x[2] as number
            const du0    = du[0] as number
            const du1    = du[1] as number
            const du2    = du[2] as number
            const dv0    = dv[0] as number
            const dv1    = dv[1] as number
            const dv2    = dv[2] as number
            positions.push(
              px, py, pz,
              px + du0, py + du1, pz + du2,
              px + du0 + dv0, py + du1 + dv1, pz + du2 + dv2,
              px + dv0, py + dv1, pz + dv2,
            )

            const sign = m > 0 ? 1 : -1
            const nx   = dim === 0 ? sign : 0
            const ny   = dim === 1 ? sign : 0
            const nz   = dim === 2 ? sign : 0
            for (let k = 0; k < 4; k++)
              normals.push(nx, ny, nz)

            const id = Math.abs(m)
            const r  = id * 37 % 255 / 255
            const g  = id * 91 % 255 / 255
            const b  = id * 151 % 255 / 255
            for (let k = 0; k < 4; k++)
              colors.push(r, g, b)

            indices.push(idBase, idBase + 1, idBase + 2, idBase, idBase + 2, idBase + 3)

            // clear consumed mask entries
            for (let l = 0; l < h; l++)
              for (let k = 0; k < w; k++)
                mask[n + k + l * N] = 0
            i += w; n += w
          }
          else {
            i++; n++
          }
        }
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}

// perf: medium. O(N³) to build, but 10-30× fewer triangles than naive.
// Run in a Worker for chunks > 32³ to keep the main thread responsive.
