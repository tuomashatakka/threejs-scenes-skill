// lib/post/webgpu/ssr.ts
// Screen-space reflections — ray-marches the depth buffer to reflect on-screen
// geometry off glossy surfaces. Wraps three's SSRNode. Pattern: GEOMETRY-AWARE
// effect; the scene pass needs an MRT exposing normal + packed metalness/
// roughness (example: webgpu_postprocessing_ssr). Add ssr.rgb onto the colour.

import type { Camera, Node } from 'three/webgpu'
import { ssr } from 'three/addons/tsl/display/SSRNode.js'




/** Options for {@link createSsr}: max ray distance, thickness, opacity, quality, blur quality, and resolution scale. */
export interface SsrOptions {
  maxDistance?:     number
  thickness?:       number
  opacity?:         number
  quality?:         number
  blurQuality?:     number
  resolutionScale?: number
}

// `normalNode` is the decoded view-space normal (colorToDirection of the normal
// MRT channel); `metalness`/`roughness` are the packed channels. Composite the
// returned node's `.rgb` over the scene colour, optionally with SMAA on top.


/**
 * Ray-march the depth buffer to compute glossy screen-space reflections off on-screen geometry.
 *
 * @param colorNode - The lit scene colour node.
 * @param depthNode - The depth node from the scene pass.
 * @param normalNode - The decoded view-space normal node (colorToDirection of the normal MRT channel).
 * @param metalness - The metalness channel node (from the `metalrough` MRT attachment .r).
 * @param roughness - The roughness channel node (from the `metalrough` MRT attachment .g).
 * @param camera - The active camera.
 * @param options.maxDistance - Maximum ray-march distance in world units.
 * @param options.thickness - Surface-thickness heuristic to avoid self-intersection.
 * @param options.opacity - Reflection-opacity blend factor.
 * @param options.quality - Ray-march quality level (0 = lowest, 1 = highest).
 * @param options.blurQuality - Reflection blur quality level.
 * @param options.resolutionScale - Fraction of full resolution for the reflection buffer.
 * @returns An SSRNode whose `.rgb` channel should be composited over the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). The scene pass needs an MRT exposing normal + packed metalness/roughness (see {@link createScenePassSSR}). High cost — reduce resolutionScale/quality on weaker GPUs.
 */
export function createSsr (
  colorNode: Node,
  depthNode: Node,
  normalNode: Node,
  metalness: Node,
  roughness: Node,
  camera: Camera,
  options: SsrOptions = {},
) {
  const node = ssr(colorNode, depthNode, normalNode, metalness, roughness, camera)
  if (options.maxDistance !== undefined)
    node.maxDistance.value = options.maxDistance
  if (options.thickness !== undefined)
    node.thickness.value = options.thickness
  if (options.opacity !== undefined)
    node.opacity.value = options.opacity
  if (options.quality !== undefined)
    node.quality.value = options.quality
  if (options.blurQuality !== undefined)
    node.blurQuality.value = options.blurQuality
  if (options.resolutionScale !== undefined)
    node.resolutionScale = options.resolutionScale
  return node
}

// perf: high. Per-pixel ray-march; lower resolutionScale/quality on weak GPUs.
