# Instancing

When and how to use `InstancedMesh` and `BatchedMesh` to collapse draw calls.

## Decision Tree

1. Count < ~50 identical objects → regular `Mesh`. Not worth instancing overhead.
2. Count ≥ 50, single geometry, single material → `InstancedMesh`.
3. Multiple different geometries sharing one material → `BatchedMesh` (r156+).
4. Multiple geometries AND multiple materials → group by material, use one
   `BatchedMesh` per material bucket.
5. Need per-instance arbitrary shader data → `InstancedBufferAttribute` on
   `InstancedMesh`, or a `DataTexture` lookup indexed by `gl_InstanceID` on
   `BatchedMesh`.

## InstancedMesh

Use when one geometry × N transforms. Trees, grass, asteroids, bullets, voxels,
props in a level. Each instance can have its own matrix and color; richer
per-instance data via `InstancedBufferAttribute`.

See `scripts/instancing-grass.js` for the full implementation.

Key points:

- Pre-declare scratch `Object3D` + `Color` at module scope; mutate inside the
  loop, never allocate.
- Call `mesh.instanceMatrix.needsUpdate = true` after writing transforms.
- Disable `frustumCulled` when one InstancedMesh covers a huge area — the
  bounding sphere becomes the whole world and culling never helps.
- For static instancing, use `StaticDrawUsage` on the matrix buffer.

## BatchedMesh

Use when N different geometries all share ONE material. City buildings of varied
shapes, modular dungeon pieces, mixed prop sets. Each instance can be individually
shown/hidden via `setVisibleAt(id, bool)` and updated via `setMatrixAt(id, matrix)`.

See `scripts/batched-buildings.js` for the full implementation.

Key points:

- You must know total vertex count and total index count upfront. Pre-sum them
  from your geometry array.
- `batch.addGeometry(geometry)` returns a geometry ID; `batch.addInstance(geomId)`
  returns an instance ID. Track both.
- `sortObjects` defaults to true (back-to-front) — benchmark with it off; for
  opaque scenes it's often faster off.
- `perObjectFrustumCulled` defaults to true and is usually correct.

## Per-Instance Shader Data

When per-instance values matter to the shader (color tint, animation phase,
texture index into an atlas), expose them as `InstancedBufferAttribute`:

```js
const phases = new Float32Array(count)
for (let i = 0; i < count; i++) phases[i] = Math.random() * Math.PI * 2
geometry.setAttribute('aPhase', new THREE.InstancedBufferAttribute(phases, 1))
```

Inside the vertex shader:

```glsl
attribute float aPhase;
varying float vPhase;
void main () {
  vPhase = aPhase;
  vec3 displaced = position + vec3(0.0, sin(uTime + aPhase) * 0.2, 0.0);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
```

For BatchedMesh, use `gl_InstanceID` (vertex shader) or `gl_DrawID` (with
`EXT_multi_draw`) to index into a `DataTexture` lookup table you bind as a
uniform sampler.

## Real-World Impact

A demo with 9,000 chair meshes dropped to ~300 draw calls after switching to
`InstancedMesh`. The same scene with `BatchedMesh` covering 12 chair variants
× 750 instances each renders in 1 draw call.

## Common Pitfalls

- Forgetting `instanceMatrix.needsUpdate = true` after setting matrices.
- Creating a new material per instance — defeats the entire optimization.
- Using `InstancedMesh` for varied geometries (use `BatchedMesh`); using
  `BatchedMesh` for one repeated geometry (use `InstancedMesh`).
- Setting `frustumCulled = true` on a single InstancedMesh covering a huge area —
  three.js culls the entire mesh as one unit, which never helps for ground cover.
