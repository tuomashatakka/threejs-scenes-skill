// lib/post/webgpu/types.ts
// Shared types for the WebGPU/TSL post-processing effects. These mirror the
// node-based PostProcessing system used by three.js WebGPU examples
// (three/webgpu + three/tsl), NOT the WebGL EffectComposer in the sibling files.

import type { Node, PassNode } from 'three/webgpu'

// A TSL node carrying colour (vec4). Most screen-space effects take one of these
// as input and return another colour node to chain into the output.
export type ColorNode = Node

// The set of texture/depth/normal nodes a scene pass can expose. Effects that
// need geometry data (ao, ssr, ssgi, sss, traa) read normal + viewZ from here.
export interface ScenePassTargets {
  pass:   PassNode
  color:  Node
  viewZ:  Node
  normal: Node
}

// An effect factory takes a colour input node (and options) and returns the
// processed colour node. Scene-space effects (outline, ao) have their own
// signatures and are not constrained to this shape.
export type ColorEffect<Options> = (input: ColorNode, options?: Options) => Node
