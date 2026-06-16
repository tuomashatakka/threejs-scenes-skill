// lib/post/webgpu/transition.ts
// Scene transition — cross-fades two scene passes, optionally masked by a
// transition texture for wipes/dissolves. Wraps three's TransitionNode. Pattern:
// MULTI-PASS composition (two scene passes + a mix texture).

import * as THREE from 'three'
import type { Node } from 'three/webgpu'
import { transition } from 'three/addons/tsl/display/TransitionNode.js'


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
