// lib/post/webgl/index.ts
// WebGL (EffectComposer) post-processing effects — the 1:1 counterpart of the
// node-based WebGPU catalogue in ../webgpu. Each effect mirrors a WebGPU effect
// of the same name; the runtime shape differs (composer Pass objects vs TSL
// nodes — see ./types.ts). Add the returned passes to a composer built with
// ../composer.ts (use addPassBeforeOutput so tone-mapping stays last).
//
// Effects with no single-Pass form return stateful handles instead:
//   - createSelectiveBloom / createEmissiveBloom -> two-composer handle (.render())
//   - createMaskPasses -> { mask, clear } stencil pair
//   - createLensflare  -> a scene object you add to a light
// WebGPU-only effects with no WebGL pass throw with guidance: createSsgi, createSss.
export * from './types.js';
// Bloom family
export * from './bloom.js';
export * from './bloom-selective.js';
export * from './bloom-emissive.js';
// Depth / geometry-aware
export * from './dof.js';
export * from './ao.js';
export * from './outline.js';
export * from './ssr.js';
// Colour / screen-space
export * from './lut.js';
export * from './afterimage.js';
export * from './anamorphic.js';
export * from './ca.js';
export * from './difference.js';
export * from './radial-blur.js';
export * from './godrays.js';
export * from './motion-blur.js';
export * from './retro.js';
// Anti-aliasing
export * from './fxaa.js';
export * from './smaa.js';
export * from './sobel.js';
export * from './ssaa.js';
export * from './traa.js';
// Stylised / structural
export * from './crt.js';
export * from './lensing.js';
export * from './burn-in.js';
export * from './pixel.js';
export * from './transition.js';
export * from './masking.js';
export * from './lensflare.js';
// WebGPU-only in three.js — these modules document the gap and throw if called.
export * from './ssgi.js';
export * from './sss.js';
//# sourceMappingURL=index.js.map