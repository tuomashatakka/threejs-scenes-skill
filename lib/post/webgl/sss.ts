// lib/post/webgl/sss.ts
// Screen-space shadows (contact shadows). There is NO official WebGL pass for
// this — the WebGPU `webgpu/sss.ts` (SSSNode) ray-marches the depth buffer using
// WebGPU-only facilities. This module keeps the catalogue 1:1 and documents the
// WebGL alternatives.
//
// WebGL alternatives for contact-style shadowing:
//   - three/addons/objects/Shadow or ContactShadows-style ground shadow blobs
//   - higher-resolution / PCF-soft shadow maps on the main light
//   - bake ambient occlusion (createAo / GTAOPass) for static contact darkening
// For genuine screen-space contact shadows, render with WebGPURenderer and use
// the WebGPU effect.

export interface SssOptions {
  // No-op placeholder; documented for signature parity with the WebGPU effect.
  intensity?: number
}

// Intentionally throws: screen-space shadows have no WebGL post implementation.
export function createSss (_options: SssOptions = {}): never {
  throw new Error(
    '[post/webgl] Screen-space shadows are WebGPU-only in three.js. Render with ' +
    'WebGPURenderer and use lib/post/webgpu/sss.ts, or rely on shadow maps + ' +
    'createAo (GTAO) in WebGL.',
  )
}

// perf: n/a — not implementable on the WebGL post stack.
