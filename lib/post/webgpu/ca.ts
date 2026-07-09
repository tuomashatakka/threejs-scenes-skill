// lib/post/webgpu/ca.ts
// Chromatic aberration — splits R/G/B radially for a lens-fringing look. Wraps
// three's ChromaticAberrationNode. Pattern: COLOUR-INPUT effect. The example
// feeds it `renderOutput(scenePass)` so the split happens in display space.

import * as THREE from 'three'
import { uniform } from 'three/tsl'
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js'
import type { ColorNode } from './types.js'




/** Options for {@link createChromaticAberration}: fringe magnitude, radial centre, and per-channel scale falloff. */
export interface ChromaticAberrationOptions {
  // Fringe magnitude.
  strength?: number
  // Centre of the radial split in screen UV (0..1).
  center?:   THREE.Vector2
  // Per-channel scale falloff.
  scale?:    number
}



/**
 * Split the RGB channels radially from a configurable centre point for a lens-fringing look.
 *
 * @param input - Colour node to process (typically display-space output).
 * @param options.strength - Fringe magnitude. Default `1`.
 * @param options.center - Screen-space UV centre of the radial split. Default `new THREE.Vector2(0.5, 0.5)`.
 * @param options.scale - Per-channel scale falloff factor. Default `1.2`.
 * @returns A ChromaticAberrationNode producing the distorted colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Low cost — three texture taps with a radial offset.
 */
export function createChromaticAberration (input: ColorNode, options: ChromaticAberrationOptions = {}) {
  const { strength = 1, center = new THREE.Vector2(0.5, 0.5), scale = 1.2 } = options
  return chromaticAberration(input, uniform(strength), uniform(center), uniform(scale))
}

// perf: low. Three texture taps with a radial offset.
