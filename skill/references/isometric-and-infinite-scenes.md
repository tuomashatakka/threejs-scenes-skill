# Isometric and Infinite Scenes

How to build iso views and scenes that scroll forever without dying.

## Isometric Camera Math

True isometric uses an `OrthographicCamera` rotated 45° around y and tilted to
`atan(1/√2) ≈ 35.264°`. Game-style "isometric" (technically dimetric) uses 30°
tilt and feels more readable for most players.

Always size the frustum from the canvas aspect ratio so resize handlers stay
clean. See `scripts/iso-camera.js`.

```js
import { OrthographicCamera, MathUtils } from 'three'

export function createIsoCamera (aspect, {
  viewSize = 20, flavor = 'dimetric', near = 0.1, far = 500,
} = {}) {
  const h = viewSize / 2
  const w = h * aspect
  const camera = new OrthographicCamera(-w, w, h, -h, near, far)

  const tilt = flavor === 'true-iso'
    ? Math.atan(1 / Math.SQRT2)
    : MathUtils.degToRad(30)
  const radius = 100
  camera.position.set(
    Math.cos(MathUtils.degToRad(45)) * radius * Math.cos(tilt),
    Math.sin(tilt) * radius,
    Math.sin(MathUtils.degToRad(45)) * radius * Math.cos(tilt),
  )
  camera.lookAt(0, 0, 0)
  camera.userData.viewSize = viewSize
  return camera
}
```

On resize:

```js
export function resizeIsoCamera (camera, aspect) {
  const h = camera.userData.viewSize / 2
  const w = h * aspect
  camera.left = -w; camera.right = w
  camera.top  =  h; camera.bottom = -h
  camera.updateProjectionMatrix()
}
```

## Three Rules for Infinite Scenes

1. **Never move the camera infinitely** — `float32` precision rots past
   ~10⁴ units. Keep the camera near the origin and translate the world the
   opposite direction, or rebase periodically: when camera distance from
   origin exceeds a threshold, subtract that offset from camera + every chunk
   position.
2. **Chunk + pool**. Divide the world into fixed-size cells. Maintain a pool of
   pre-built chunk meshes; recycle them as the camera moves instead of
   allocating/disposing.
3. **Generate off the main thread** when chunk content is heavy (procedural
   meshes, decoration, navmesh). Use a `Worker` with a transferable
   `ArrayBuffer` for the geometry payload.

## Chunk Manager

See `scripts/chunk-manager.js` for a full implementation.

API:

```js
const chunks = createChunkManager({
  chunkSize: 32,            // world units per chunk edge
  viewRadius: 4,            // chunks visible in any direction
  rebaseThreshold: 4096,    // rebase origin when camera > this
  build: (cx, cz, target) => {
    // populate target Group with chunk content
    // cx, cz are chunk grid coords
  },
})

scene.add(chunks.root)

// each frame
chunks.update(camera.position)
```

## Isometric Tile Streaming

For grid-style worlds (city builders, dungeon crawlers, runners), pair the
chunk manager with a tile factory that batches all tiles within a chunk into
one `BatchedMesh` keyed by material. Result: a 20×20 chunk view radius can
render ~10k tiles at < 30 draw calls.

```js
function buildIsoChunk (cx, cz, target) {
  const tileBatch = new THREE.BatchedMesh(CHUNK_SIZE * CHUNK_SIZE, totalVerts, totalIndex, sharedTileMaterial)
  for (let z = 0; z < CHUNK_SIZE; z++) {
    for (let x = 0; x < CHUNK_SIZE; x++) {
      const tileType = sampleTileType(cx * CHUNK_SIZE + x, cz * CHUNK_SIZE + z)
      const geomId = tileBatch.addGeometry(tileGeometries[tileType])
      const instId = tileBatch.addInstance(geomId)
      tileBatch.setMatrixAt(instId, makeTileMatrix(x, z))
    }
  }
  target.add(tileBatch)
}
```

## Origin Rebasing

When the camera drifts far from origin, subtract its position from every
chunk and from the camera itself, then track the accumulated offset:

```js
const REBASE_THRESHOLD = 4096
const origin = new THREE.Vector3()    // accumulated offset
const scratch = new THREE.Vector3()

function maybeRebase (camera, chunks) {
  if (camera.position.lengthSq() < REBASE_THRESHOLD * REBASE_THRESHOLD) return
  scratch.copy(camera.position)
  camera.position.sub(scratch)
  origin.add(scratch)
  for (const chunk of chunks.values()) chunk.position.sub(scratch)
}
```

This keeps everything in float32-comfortable range forever.

## Perf Checklist

- Clamp chunk view radius based on device tier; mobile gets `viewRadius - 2`.
- Never `await` chunk builds serially in a frame — fire-and-forget and let
  chunks pop in.
- Frustum-cull chunks against the ortho frustum; mark whole chunks invisible
  (`group.visible = false`) instead of testing every child.
- Ortho cameras don't need LOD, but they DO benefit from culling distant
  decoration layers.
- Pre-build chunk geometries in a `Worker` and post `ArrayBuffer`s back via
  transferable objects:

  ```js
  // in worker
  postMessage({ positions, indices, normals }, [positions.buffer, indices.buffer, normals.buffer])
  ```

## Side-Scroller Variant

For 2.5D side-scrollers, lock camera to (x, y) and let z stay constant. Use
the same chunk manager but key chunks by x only (1D), not (cx, cz).

## Common Pitfalls

- Letting the camera fly forever in world space — float precision rots, jitter
  appears around 10⁴ units.
- Building chunks synchronously in the render loop — every chunk spawn = a
  visible hitch.
- Disposing and reallocating chunk meshes each move instead of pooling.
- Forgetting that ortho cameras have no perspective foreshortening — long
  thin objects look weird. Use a perspective camera with very low FOV (~15°)
  if you need "fake iso" with subtle depth cues.

## Live three.js docs

- API pages: [OrthographicCamera](https://threejs.org/docs/pages/OrthographicCamera.html.md), [Fog](https://threejs.org/docs/pages/Fog.html.md), [FogExp2](https://threejs.org/docs/pages/FogExp2.html.md).
- Manual: `node scripts/query-threejs-docs.js manual en/fog`. Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
