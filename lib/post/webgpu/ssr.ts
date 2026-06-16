// lib/post/webgpu/ssr.ts
// Screen-space reflections — ray-marches the depth buffer to reflect on-screen
// geometry off glossy surfaces. Wraps three's SSRNode. Pattern: GEOMETRY-AWARE
// effect; the scene pass needs an MRT exposing normal + packed metalness/
// roughness (example: webgpu_postprocessing_ssr). Add ssr.rgb onto the colour.

import type { Camera, Node } from 'three/webgpu'
import { ssr } from 'three/addons/tsl/display/SSRNode.js'


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
