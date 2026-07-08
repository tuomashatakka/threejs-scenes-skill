// lib/primitives/index.ts
// threejs-scenes/primitives — things you can put in a scene: geometry
// construction (shapes, extrusion, lathe, tubes), vertex manipulation and
// merging, materials and procedural textures, seeded noise/scatter, instanced
// and batched high-count meshes, and voxel storage + meshing. Everything that
// takes a seed is deterministic: same inputs, same mesh.

// geometry construction + manipulation
export * from '../geometry/shapes.js'
export * from '../geometry/extrude.js'
export * from '../geometry/lathe.js'
export * from '../geometry/modifiers.js'
export * from '../geometry/merge.js'
export * from '../geometry/path-tube.js'
export * from '../geometry/connection-graph.js'
export * from '../geometry/infinite-ground.js'

// materials + textures
export * from '../materials/index.js'
export * from '../procedural/noise-texture.js'

// deterministic generation
export * from '../procedural/rng.js'
export * from '../procedural/noise.js'
export * from '../procedural/poisson-disk.js'
export * from '../procedural/body.js'

// high-count meshes
export * from '../instancing/index.js'

// voxels
export * from '../voxels/voxel-data.js'
export * from '../voxels/greedy-mesh.js'
