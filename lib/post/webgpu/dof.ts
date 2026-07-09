// lib/post/webgpu/dof.ts
// Depth of field — bokeh blur by distance from the focus plane. Wraps three's
// DepthOfFieldNode. Pattern: COLOUR + VIEW-Z effect (needs the pass viewZ node).
// Also exports a `createDofBasic` mirroring the dof/basic example: a cheap
// boxBlur lerped by a view-space focus distance, no dedicated node.

import * as THREE from 'three'
import { mix, smoothstep, uniform } from 'three/tsl'
import { boxBlur } from 'three/addons/tsl/display/boxBlur.js'
import { dof } from 'three/addons/tsl/display/DepthOfFieldNode.js'
import type { Node } from 'three/webgpu'
import type { ColorNode } from './types.js'


/** Options for {@link createDof}. */
export interface DofOptions {
  focusDistance?: number
  focalLength?:   number
  bokehScale?:    number
}

/** Wrap a DepthOfFieldNode that applies bokeh-blur by distance from the focus plane. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createDof (input: ColorNode, viewZ: ColorNode, options: DofOptions = {}) {
  const { focusDistance = 10, focalLength = 1, bokehScale = 1 } = options
  return dof(input, viewZ, focusDistance, focalLength, bokehScale)
}

// perf: medium-high. Sampling cost scales with bokehScale.

/** Options for {@link createDofBasic}. */
export interface DofBasicOptions {
  // View-space focus point; everything near focusPoint.z stays sharp.
  focusPoint?:  THREE.Vector3
  // Distances (positive) from the focus depth where blur starts / is maximal.
  minDistance?: number
  maxDistance?: number
  // Box-blur kernel size and sample spread.
  blurSize?:    number
  blurSpread?:  number
}

// Cheap DOF (dof/basic example): box-blur the colour, then lerp sharp<->blurred
// by smoothstep over the absolute view-Z distance to the focus point.
/** Cheap DOF: box-blur the colour input, then lerp sharp<->blurred by smoothstep over view-Z distance to the focus point. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createDofBasic (input: Node<'vec4'>, viewZ: Node<'float'>, options: DofBasicOptions = {}) {
  const {
    focusPoint = new THREE.Vector3(),
    minDistance = 1,
    maxDistance = 3,
    blurSize = 2,
    blurSpread = 4,
  }                    = options
  const focusPointView = uniform(focusPoint)
  const blurred        = boxBlur(input, { size: uniform(blurSize), separation: uniform(blurSpread) })
  const blur           = smoothstep(minDistance, maxDistance, viewZ.sub(focusPointView.z).abs())
  return mix(input, blurred, blur)
}

// perf: medium. One box-blur pass; far cheaper than the bokeh DepthOfFieldNode.
