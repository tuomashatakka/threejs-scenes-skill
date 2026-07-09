// lib/post/webgpu/motion-blur.ts
// Per-pixel motion blur — smears colour along each pixel's screen-space velocity.
// Wraps three's motionBlur. Pattern: COLOUR + VELOCITY effect; the scene pass
// must expose a `velocity` MRT channel (use the TSL `velocity` node).

import { int } from 'three/tsl'
import type { Node } from 'three/webgpu'
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js'


/** Options for {@link createMotionBlur}. */
export interface MotionBlurOptions {
  // Number of samples taken along the velocity vector.
  numSamples?: number
}

// `velocityNode` is the scene pass's velocity texture node, typically scaled by a
// blur-amount uniform (scenePass.getTextureNode('velocity').mul(amount)).
/** Wrap a motionBlur node that smears colour along each pixel's screen-space velocity vector. The scene pass must expose a velocity MRT channel. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createMotionBlur (input: Node, velocityNode: Node, options: MotionBlurOptions = {}) {
  const { numSamples } = options
  return numSamples === undefined
    ? motionBlur(input, velocityNode)
    : motionBlur(input, velocityNode, int(numSamples))
}

// perf: medium. Cost scales with numSamples; needs the extra velocity attachment.
