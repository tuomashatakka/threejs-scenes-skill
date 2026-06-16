// lib/post/webgpu/outline.ts
// Outline — edge highlight around selected objects. Wraps three's OutlineNode.
// Pattern: SCENE/CAMERA effect (renders its own selection pass). Composite over
// the scene colour using the example's recommended blend.

import * as THREE from 'three'
import { outline } from 'three/addons/tsl/display/OutlineNode.js'
import type { OutlineNodeParams } from 'three/addons/tsl/display/OutlineNode.js'


export type OutlineOptions = OutlineNodeParams

export function createOutline (scene: THREE.Scene, camera: THREE.Camera, options?: OutlineOptions) {
  return outline(scene, camera, options)
}

// perf: medium. Renders a separate selection pass + edge detection.
