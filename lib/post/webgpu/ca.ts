// lib/post/webgpu/ca.ts
// Chromatic aberration — splits R/G/B radially for a lens-fringing look. Wraps
// three's ChromaticAberrationNode. Pattern: COLOUR-INPUT effect. The example
// feeds it `renderOutput(scenePass)` so the split happens in display space.

import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js'
import type { ColorNode } from './types.js'


/** Options for {@link createChromaticAberration}. */
export interface ChromaticAberrationOptions {
  // Fringe magnitude.
  strength?: number
  // Centre of the radial split in screen UV (0..1).
  center?:   THREE.Vector2
  // Per-channel scale falloff.
  scale?:    number
}

/** Wrap a ChromaticAberrationNode that splits R/G/B radially from a configurable centre for a lens-fringing look. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createChromaticAberration (input: ColorNode, options: ChromaticAberrationOptions = {}) {
  const { strength = 1, center = new THREE.Vector2(0.5, 0.5), scale = 1.2 } = options
  return chromaticAberration(input, uniform(strength), uniform(center), uniform(scale))
}

// perf: low. Three texture taps with a radial offset.
