// lib/post/webgl/godrays.ts
// God rays / volumetric light shafts — screen-space radial scattering toward the
// light. NOT reimplemented here: the canonical implementation lives in the
// parent dir at `lib/post/god-rays-pass.ts` (a faithful port of
// Erkaman/glsl-godrays). It is re-exported here so the WebGL post catalogue
// matches the WebGPU one (`lib/post/webgpu/godrays.ts`).

export { createGodRaysPass } from '../god-rays-pass.js'
export type { GodRaysPass } from '../god-rays-pass.js'

// perf: medium. ~60 radial march samples per fragment toward the light position.
