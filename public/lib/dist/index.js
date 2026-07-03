// lib/index.ts
// threejs-scenes — strictly-typed factories and interfaces for production
// vanilla three.js scenes. Re-exports every submodule. For tree-shaking you
// may also import from the subpaths: 'threejs-scenes/core',
// 'threejs-scenes/post', 'threejs-scenes/jsx', etc.
export * from './types.js';
// Domain namespaces (1.6): the same library grouped by concern. Prefer these
// (or the matching subpaths /primitives /raster /compose /view /state
// /scaffold, and the curated barrel /main) in new code.
export * as primitives from './primitives/index.js';
export * as raster from './raster/index.js';
export * as compose from './compose/index.js';
export * as view from './view/index.js';
export * as state from './state/index.js';
export * as scaffold from './scaffold/index.js';
export * from './core/index.js';
export * from './camera/index.js';
export * from './instancing/index.js';
export * from './geometry/index.js';
export * from './materials/index.js';
export * from './loaders/index.js';
export * from './animation/index.js';
export * from './props/index.js';
export * from './lighting/index.js';
export * from './particles/index.js';
export * from './post/index.js';
export * from './procedural/index.js';
export * from './voxels/index.js';
export * from './architecture/index.js';
// NOTE: WebGPU/TSL post effects are intentionally NOT re-exported from this
// barrel — they pull in `three/webgpu` + `three/tsl`, which would force every
// consumer of this WebGL barrel (including importmap / CDN users) to resolve
// those modules. Import them from the dedicated subpath instead:
//   import * as webgpuPost from '@tuomashatakka/threejs-scenes/post/webgpu'
// The reactive JSX layer is likewise its own subpath: '@tuomashatakka/threejs-scenes/jsx'.
//# sourceMappingURL=index.js.map