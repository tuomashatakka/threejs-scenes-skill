// lib/voxels/chunk-manager.ts
// Infinite world chunk manager. Pools Group instances, recycles on movement,
// rebases origin when camera drifts past threshold to dodge float32 precision
// rot. Ported from scripts/chunk-manager.js.

import * as THREE from 'three'


const scratchCenter = new THREE.Vector3()

export type ChunkBuilder = (
  cx: number,
  cz: number,
  chunk: THREE.Group,
) => void | Promise<void>

export interface ChunkManagerOptions {
  chunkSize:        number
  viewRadius:       number
  rebaseThreshold?: number
  build:            ChunkBuilder
}

export interface ChunkManager {
  root:                 THREE.Group
  update (cameraWorldPos: THREE.Vector3): Promise<void>
  dispose (): void
  readonly loadedCount: number
  readonly pooledCount: number
}

export function createChunkManager ({
  chunkSize,
  viewRadius,
  rebaseThreshold = 4096,
  build,
}: ChunkManagerOptions): ChunkManager {
  if (!chunkSize)
    throw new Error('chunkSize required')
  if (!viewRadius)
    throw new Error('viewRadius required')
  if (!build)
    throw new Error('build callback required')

  const root                = new THREE.Group()
  const active              = new Map<string, THREE.Group>()
  const pool: THREE.Group[] = []
  const origin              = new THREE.Vector3()

  const keyOf = (cx: number, cz: number): string => `${cx}:${cz}`

  function acquireChunk (): THREE.Group {
    const g = pool.pop() ?? new THREE.Group()
    root.add(g)
    return g
  }

  function releaseChunk (g: THREE.Group): void {
    g.traverse(child => {
      const mesh = child as THREE.Mesh
      if (mesh.geometry)
        mesh.geometry.dispose()
    })
    g.clear()
    root.remove(g)
    pool.push(g)
  }

  async function update (cameraWorldPos: THREE.Vector3): Promise<void> {
    const ccx = Math.floor((cameraWorldPos.x + origin.x) / chunkSize)
    const ccz = Math.floor((cameraWorldPos.z + origin.z) / chunkSize)

    const needed = new Set<string>()
    for (let dz = -viewRadius; dz <= viewRadius; dz++)
      for (let dx = -viewRadius; dx <= viewRadius; dx++) {
        const cx  = ccx + dx
        const cz  = ccz + dz
        const key = keyOf(cx, cz)
        needed.add(key)
        if (!active.has(key)) {
          const chunk = acquireChunk()
          chunk.position.set(cx * chunkSize - origin.x, 0, cz * chunkSize - origin.z)
          active.set(key, chunk)
          // fire-and-forget; chunk pops in when ready
          Promise.resolve(build(cx, cz, chunk)).catch(err => console.error('chunk build failed', err))
        }
      }

    for (const [ key, chunk ] of active)
      if (!needed.has(key)) {
        active.delete(key)
        releaseChunk(chunk)
      }

    // rebase if camera drifts far
    if (cameraWorldPos.lengthSq() > rebaseThreshold * rebaseThreshold) {
      const offset = scratchCenter.copy(cameraWorldPos)
      cameraWorldPos.sub(offset)
      origin.add(offset)
      for (const chunk of active.values())
        chunk.position.sub(offset)
    }
  }

  function dispose (): void {
    for (const chunk of active.values())
      releaseChunk(chunk)
    active.clear()
    pool.length = 0
  }

  return {
    root,
    update,
    dispose,
    get loadedCount () {
      return active.size
    },
    get pooledCount () {
      return pool.length
    },
  }
}

// perf: medium. one Group per visible chunk; chunks pooled instead of allocated.
// Memory: bounded by viewRadius. (2 * viewRadius + 1)² active chunks max.
