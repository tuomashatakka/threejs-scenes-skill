// lib/post/webgl/types.ts
// Shared types for the WebGL (EffectComposer) post-processing effects. These
// mirror the WebGPU/TSL effect catalogue in the sibling `../webgpu` directory,
// but the runtime shape differs: WebGPU effects are TSL nodes composed into a
// RenderPipeline output graph, whereas these are three.js `Pass` objects pushed
// onto an EffectComposer chain (see ../composer.ts). Same effect names + tuning
// knobs, different plumbing.

import type * as THREE from 'three'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


export type { Pass }

// Effects that re-render the scene or sample geometry (dof, ao, outline, ssr,
// pixel, ssaa, traa, transition) need these references. Colour-only ShaderPass
// effects (ca, sobel, fxaa, afterimage, lut, anamorphic, difference) don't.
export interface WebGlPassContext {
  renderer: THREE.WebGLRenderer
  scene:    THREE.Scene
  camera:   THREE.Camera
  width:    number
  height:   number
}

// A factory that produces a composer Pass. Add it with `composer.addPass(pass)`
// or the composer handle's `addPassBeforeOutput(pass)` so tone-mapping stays last.
export type WebGlEffect = Pass

// Effects whose resolution-dependent uniforms must track canvas resizes expose
// this so the composer's setSize hook can forward dimensions.
export interface Resizable {
  setSize (width: number, height: number): void
}
