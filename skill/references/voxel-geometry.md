# Voxel Geometry

How to build performant voxel worlds in vanilla three.js.

## Data Model

Store voxels in a flat `Uint16Array` (id per cell) sized `chunkSize³`. Encode
(id, light, metadata) into bit-packed values if needed. See
`scripts/voxel-data.js` for the `VoxelChunk` class.

```js
export class VoxelChunk {
  constructor (size) {
    this.size = size
    this.data = new Uint16Array(size * size * size)
  }
  _idx (x, y, z) { return (y * this.size + z) * this.size + x }
  get (x, y, z) {
    if (x < 0 || y < 0 || z < 0 || x >= this.size || y >= this.size || z >= this.size) return 0
    return this.data[this._idx(x, y, z)]
  }
  set (x, y, z, id) { this.data[this._idx(x, y, z)] = id }
}
```

## Greedy Meshing

Naive meshing emits 6 quads per voxel — millions of triangles for a small
world. Greedy meshing merges coplanar adjacent faces of the same id into
maximum-size rectangles per axis slice. Typical reduction: 10–30× fewer
triangles. See `scripts/greedy-mesh.js` for the full algorithm.

The algorithm walks each of the 6 axis-aligned directions, slicing the chunk
into 2D mask planes, then sweeps each mask emitting the largest possible
rectangles of identical voxel id.

## Smooth Voxels

When the blocky aesthetic is wrong, use marching cubes on a scalar field.
Three.js doesn't ship a marching cubes BufferGeometry builder, but
`three/addons/objects/MarchingCubes.js` provides a real-time variant for
metaball-style effects, and the table-driven algorithm is ~150 lines for
static meshing.

For editable terrain, store the SDF in a `DataTexture` (2D slice atlas) and
remesh affected chunks on edit.

## Atlas Texturing

Different voxel ids need different surface looks. Pack all material textures
into a single atlas, then pass a `aTextureIndex` per vertex (or per face)
attribute into the shader:

```glsl
attribute float aTextureIndex;
uniform sampler2D uAtlas;
uniform float uAtlasGrid;   // e.g. 4.0 for a 4x4 grid

varying vec2 vUv;
varying float vTexIdx;

// vertex
vTexIdx = aTextureIndex;
vUv = uv;

// fragment
float col = mod(vTexIdx, uAtlasGrid);
float row = floor(vTexIdx / uAtlasGrid);
vec2 atlasUv = (vec2(col, row) + fract(vUv)) / uAtlasGrid;
gl_FragColor = texture2D(uAtlas, atlasUv);
```

## Ambient Occlusion (Per-Vertex)

Cheap voxel AO: for each face vertex, count how many of the 3 adjacent voxels
(corner + 2 side neighbors) are solid. Map to a darkening factor (0 = no AO,
3 = full corner). Store as a vertex attribute and multiply into the fragment
color. Adds dramatic depth for almost no cost.

## Voxel Perf

- One `BufferGeometry` per chunk; one `Mesh` per chunk; share one material
  across all chunks.
- Rebuild only chunks that changed; never rebuild the world.
- Run greedy meshing in a `Worker` for chunks > 32³. Transfer the
  `ArrayBuffer`s back to avoid copies.
- Texture variation via vertex colors or a per-vertex `aTextureIndex`
  attribute sampling a texture atlas.
- For mining/building games, mark adjacent chunks dirty when a face on a
  chunk boundary changes — they need to remesh too because their face
  visibility now differs.

## Worker-Based Chunk Generation

```js
// worker.js
self.onmessage = (e) => {
  const { chunkData, size } = e.data
  const chunk = new VoxelChunk(size)
  chunk.data.set(chunkData)
  const geometryArrays = buildGreedyMeshArrays(chunk)
  self.postMessage(geometryArrays, [
    geometryArrays.positions.buffer,
    geometryArrays.normals.buffer,
    geometryArrays.indices.buffer,
  ])
}

// main thread
const worker = new Worker(new URL('./voxel-worker.js', import.meta.url), { type: 'module' })
worker.onmessage = (e) => {
  const { positions, normals, indices } = e.data
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('normal',   new THREE.BufferAttribute(normals, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  scene.add(new THREE.Mesh(geometry, sharedVoxelMaterial))
}
worker.postMessage({ chunkData: chunk.data, size: chunk.size }, [chunk.data.buffer])
```

## Common Pitfalls

- Naive meshing (6 quads per cell) — works for 4×4×4 demos, dies at 16³.
- Updating the entire chunk's geometry every frame — only rebuild on edit.
- Forgetting that voxel ids are typically `uint16` to fit material variety
  past 256.
- Not marking neighbor chunks dirty on edge-voxel edits — leaves invisible
  faces visible.
- Per-voxel `Mesh` instances — death by 1000 draw calls.
