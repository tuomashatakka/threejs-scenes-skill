// lib/post/webgpu/outline.ts
// Outline — edge highlight around selected objects. Wraps three's OutlineNode.
// Pattern: SCENE/CAMERA effect (renders its own selection pass). Composite over
// the scene colour using the example's recommended blend.

import * as THREE from 'three'
import { outline } from 'three/addons/tsl/display/OutlineNode.js'
import type { OutlineNodeParams } from 'three/addons/tsl/display/OutlineNode.js'




/** Options for {@link createOutline}, mirroring {@link OutlineNodeParams} from three.js (selection, colour, thickness, pulse speed). */
export type OutlineOptions = OutlineNodeParams



/**
 * Render edge highlights around selected objects using a separate selection pass and edge detection.
 *
 * @param scene - The scene containing objects to outline.
 * @param camera - The active camera.
 * @param options - Outline parameters matching {@link OutlineNodeParams}.
 * @returns An OutlineNode whose output should be composited over the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Medium cost — renders a separate selection pass plus edge detection.
 */
export function createOutline (scene: THREE.Scene, camera: THREE.Camera, options?: OutlineOptions) {
  return outline(scene, camera, options)
}

// perf: medium. Renders a separate selection pass + edge detection.
