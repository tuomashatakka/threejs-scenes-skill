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




/** Options for {@link createDof}: focus distance, focal length, and bokeh scale. */
export interface DofOptions {
  focusDistance?: number
  focalLength?:   number
  bokehScale?:    number
}



/**
 * Apply bokeh depth-of-field blur based on each fragment's distance from the focus plane.
 *
 * @param input - Colour node to blur.
 * @param viewZ - View-space Z-depth node from the scene pass (scenePass.getViewZNode()).
 * @param options.focusDistance - World-space distance to the focus plane. Default `10`.
 * @param options.focalLength - Focal length controlling the blur falloff rate. Default `1`.
 * @param options.bokehScale - Magnitude of the bokeh blur. Default `1`.
 * @returns A DepthOfFieldNode producing the defocused colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium-high cost — sampling cost scales with bokehScale.
 */
export function createDof (input: ColorNode, viewZ: ColorNode, options: DofOptions = {}) {
  const { focusDistance = 10, focalLength = 1, bokehScale = 1 } = options
  return dof(input, viewZ, focusDistance, focalLength, bokehScale)
}

// perf: medium-high. Sampling cost scales with bokehScale.



/** Options for {@link createDofBasic}: focus point, blur distance range, box-blur kernel size, and sample spread. */
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


/**
 * Cheap depth-of-field: box-blur the colour input, then lerp between sharp and blurred by smoothstep over view-Z distance to the focus point.
 *
 * @param input - Colour node (vec4) to blur.
 * @param viewZ - View-space Z-depth node (float) from the scene pass.
 * @param options.focusPoint - View-space focus point; fragments near this Z stay sharp. Default `new THREE.Vector3()`.
 * @param options.minDistance - Distance from focus Z where blur begins. Default `1`.
 * @param options.maxDistance - Distance from focus Z where blur is maximal. Default `3`.
 * @param options.blurSize - Box-blur kernel size in pixels. Default `2`.
 * @param options.blurSpread - Sample spread for the box blur. Default `4`.
 * @returns A colour node blending the sharp and box-blurred inputs.
 * @remarks Requires the WebGPU renderer (three/webgpu). Much cheaper than the bokeh variant — one box-blur pass.
 */
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
