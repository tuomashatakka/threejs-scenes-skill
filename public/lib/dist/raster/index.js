// lib/raster/index.ts
// threejs-scenes/raster — how the scene turns into pixels: lighting rigs,
// cameras, color correction and post-processing chains, and particle
// emitters (render-technique-bound: billboards, GPGPU, blending). WebGPU/TSL
// node effects stay off this barrel — import 'threejs-scenes/raster/webgpu'
// (they pull in three/webgpu + three/tsl).
export * from '../lighting/index.js';
export * from '../camera/index.js';
export * from '../post/index.js';
// particles v2 (the deprecated v1 createParticleEmitter is NOT re-exported —
// import it from 'threejs-scenes/particles' while it lasts)
export * from '../particles/curves.js';
export * from '../particles/emitter.js';
export * from '../particles/gpu-emitter.js';
//# sourceMappingURL=index.js.map