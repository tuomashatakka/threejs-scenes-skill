// lib/post/webgpu/outline.ts
// Outline — edge highlight around selected objects. Wraps three's OutlineNode.
// Pattern: SCENE/CAMERA effect (renders its own selection pass). Composite over
// the scene colour using the example's recommended blend.

import * as THREE from 'three'
import { outline } from 'three/addons/tsl/display/OutlineNode.js'
import type { OutlineNodeParams } from 'three/addons/tsl/display/OutlineNode.js'


/** Options for {@link createOutline}, mirroring OutlineNodeParams from three.js. */
export type OutlineOptions = OutlineNodeParams

/** Wrap an OutlineNode that renders edge highlights around selected objects via a separate selection pass. Composite over the scene colour. @remarks Requires the WebGPU renderer (three/webgpu) and ships via the 'threejs-scenes/webgpu' entry point. */
export function createOutline (scene: THREE.Scene, camera: THREE.Camera, options?: OutlineOptions) {
  return outline(scene, camera, options)
}

// perf: medium. Renders a separate selection pass + edge detection.
