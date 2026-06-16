// lib/post/webgpu/retro.ts
// Retro / PSX pass — low-resolution rendering, vertex snapping and affine
// texture distortion emulating 5th-gen console hardware. Wraps three's
// retroPass, which is a PassNode that renders the scene, so use it INSTEAD of a
// plain scene pass. Pattern: SCENE PASS replacement; use the node as output.

import * as THREE from 'three'
import type { Node } from 'three/webgpu'
import { retroPass } from 'three/addons/tsl/display/RetroPassNode.js'


export interface RetroOptions {
  // Optional node controlling affine (perspective-incorrect) texture distortion.
  affineDistortion?: Node | null
  // Whether textures are filtered (false = nearest, more authentic).
  filterTextures?:   boolean
}

export function createRetroPass (scene: THREE.Scene, camera: THREE.Camera, options: RetroOptions = {}) {
  return retroPass(scene, camera, options)
}

// perf: medium. Renders the scene at low resolution with custom vertex/fragment
// node injection.
