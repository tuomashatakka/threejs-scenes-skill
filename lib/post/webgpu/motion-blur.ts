// lib/post/webgpu/motion-blur.ts
// Per-pixel motion blur — smears colour along each pixel's screen-space velocity.
// Wraps three's motionBlur. Pattern: COLOUR + VELOCITY effect; the scene pass
// must expose a `velocity` MRT channel (use the TSL `velocity` node).

import { int } from 'three/tsl'
import type { Node } from 'three/webgpu'
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js'




/** Options for {@link createMotionBlur}: number of velocity samples. */
export interface MotionBlurOptions {
  // Number of samples taken along the velocity vector.
  numSamples?: number
}

// `velocityNode` is the scene pass's velocity texture node, typically scaled by a
// blur-amount uniform (scenePass.getTextureNode('velocity').mul(amount)).


/**
 * Smear colour along each pixel's screen-space velocity vector for a motion-blur effect.
 *
 * @param input - Colour node to blur.
 * @param velocityNode - Screen-space velocity node, typically `scenePass.getTextureNode('velocity').mul(amount)`.
 * @param options.numSamples - Number of samples along the velocity vector; higher = smoother but costlier.
 * @returns A motionBlur node producing the blurred colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). The scene pass must expose a `velocity` MRT channel (see {@link createScenePassVelocity}). Medium cost — scales with numSamples.
 */
export function createMotionBlur (input: Node, velocityNode: Node, options: MotionBlurOptions = {}) {
  const { numSamples } = options
  return numSamples === undefined
    ? motionBlur(input, velocityNode)
    : motionBlur(input, velocityNode, int(numSamples))
}

// perf: medium. Cost scales with numSamples; needs the extra velocity attachment.
