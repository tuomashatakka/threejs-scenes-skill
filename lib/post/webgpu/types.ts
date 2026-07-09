// lib/post/webgpu/types.ts
// Shared types for the WebGPU/TSL post-processing effects. These mirror the
// node-based PostProcessing system used by three.js WebGPU examples
// (three/webgpu + three/tsl), NOT the WebGL EffectComposer in the sibling files.

import type { Node, PassNode } from 'three/webgpu'

// A TSL node carrying colour (vec4). Most screen-space effects take one of these
// as input and return another colour node to chain into the output.
/** A TSL node carrying colour (vec4). Most screen-space effects take one of these as input and return another colour node. */
export type ColorNode = Node

// The set of texture/depth/normal nodes a scene pass can expose. Effects that
// need geometry data (ao, ssr, ssgi, sss, traa) read normal + viewZ from here.
/** The set of texture, depth, and normal nodes a scene PassNode can expose. Geometry-aware effects (AO, SSR, SSGI, SSS, TRAA) read normal and viewZ from here. */
export interface ScenePassTargets {
  pass:   PassNode
  color:  Node
  viewZ:  Node
  normal: Node
}

// An effect factory takes a colour input node (and options) and returns the
// processed colour node. Scene-space effects (outline, ao) have their own
// signatures and are not constrained to this shape.
/** Generic shape for an effect factory: takes a colour input node and optional options, returns the processed colour node. Scene-space effects (outline, AO) have their own signatures. */
export type ColorEffect<Options> = (input: ColorNode, options?: Options) => Node
