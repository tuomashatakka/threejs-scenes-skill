// lib/post/webgl/ssgi.ts
// Screen-space global illumination. There is NO official WebGL pass for SSGI in
// three.js — the WebGPU `webgpu/ssgi.ts` (SSGINode) relies on the WebGPU
// renderer's MRT + compute features that the WebGL post-processing stack does
// not provide. This module exists only to keep the catalogue 1:1 and to point
// you at the closest WebGL approximation.
//
// Closest WebGL approximation: combine ambient occlusion (createAo / GTAOPass)
// with screen-space reflections (createSsr / SSRPass). That captures contact
// darkening + glossy bounce, which together read as crude one-bounce GI. For
// true SSGI, render with WebGPURenderer and use the WebGPU effect.

export interface SsgiOptions {
  // No-op placeholder; documented for signature parity with the WebGPU effect.
  intensity?: number
}

// Intentionally throws: SSGI has no WebGL implementation. Use the WebGPU effect
// (lib/post/webgpu/ssgi.ts) or compose createAo + createSsr as an approximation.
export function createSsgi (_options: SsgiOptions = {}): never {
  throw new Error(
    '[post/webgl] SSGI is WebGPU-only in three.js. Render with WebGPURenderer and ' +
    'use lib/post/webgpu/ssgi.ts, or approximate in WebGL by combining ' +
    'createAo (GTAO) + createSsr (SSR).',
  )
}

// perf: n/a — not implementable on the WebGL post stack.
