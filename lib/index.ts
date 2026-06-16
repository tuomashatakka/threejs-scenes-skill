// lib/index.ts
// threejs-scenes — strictly-typed factories and interfaces for production
// vanilla three.js scenes. Re-exports every submodule. For tree-shaking you
// may also import from the subpaths: 'threejs-scenes/core',
// 'threejs-scenes/post', etc.

export * from './types.js'

export * from './core/index.js'
export * from './camera/index.js'
export * from './instancing/index.js'
export * from './geometry/index.js'
export * from './materials/index.js'
export * from './loaders/index.js'
export * from './animation/index.js'
export * from './props/index.js'
export * from './lighting/index.js'
export * from './particles/index.js'
export * from './post/index.js'
// WebGPU/TSL post effects are namespaced to avoid clashing with the WebGL
// post exports above. Require a WebGPURenderer. Also at the './post/webgpu' subpath.
export * as webgpuPost from './post/webgpu/index.js'
export * from './procedural/index.js'
export * from './voxels/index.js'
export * from './architecture/index.js'
