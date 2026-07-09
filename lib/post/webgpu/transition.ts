// lib/post/webgpu/transition.ts
// Scene transition — cross-fades two scene passes, optionally masked by a
// transition texture for wipes/dissolves. Wraps three's TransitionNode. Pattern:
// MULTI-PASS composition (two scene passes + a mix texture).

import * as THREE from 'three'
import type { Node } from 'three/webgpu'
import { transition } from 'three/addons/tsl/display/TransitionNode.js'




/** Options for {@link createTransition}: mix ratio, wipe edge softness, and texture-wipe blend factor. */
export interface TransitionOptions {
  // 0 = fully scene A, 1 = fully scene B.
  mixRatio?:   number
  // Edge softness of the textured wipe.
  threshold?:  number
  // 1 = use the mix texture for the wipe shape, 0 = plain linear cross-fade.
  useTexture?: number
}

// `passA` / `passB` are two scene pass colour nodes; `mixTexture` is the wipe
// pattern texture node. Returns the blended colour node to use as output.


/**
 * Cross-fade between two scene-pass colour nodes, optionally masked by a wipe texture for directional transitions (wipes, dissolves).
 *
 * @param passA - Colour node for the first scene (starting state).
 * @param passB - Colour node for the second scene (ending state).
 * @param mixTexture - Wipe-pattern texture node. A plain white texture produces a linear cross-fade.
 * @param options.mixRatio - Blend factor: 0 = fully passA, 1 = fully passB. Default `0`.
 * @param options.threshold - Edge softness of the textured wipe. Default `0.1`.
 * @param options.useTexture - Blend between textured wipe (1) and plain linear cross-fade (0). Default `1`.
 * @returns A TransitionNode producing the blended colour, to use as the output.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — both scenes are rendered during the transition window.
 */
export function createTransition (
  passA: Node,
  passB: Node,
  mixTexture: Node,
  options: TransitionOptions = {},
) {
  const { mixRatio = 0, threshold = 0.1, useTexture = 1 } = options
  return transition(passA, passB, mixTexture, mixRatio, threshold, useTexture)
}

// perf: medium. Two scene renders during the transition window.
