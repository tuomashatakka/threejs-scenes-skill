// lib/post/webgpu/traa.ts
// Temporal reprojection anti-aliasing — jitters the camera each frame and blends
// history reprojected by per-pixel velocity, resolving sub-pixel edges and
// denoising stochastic effects (SSGI/SSS). Wraps three's TRAANode. Pattern:
// GEOMETRY-AWARE effect; the scene pass needs depth + a `velocity` MRT channel.

import type { Camera, Node, TextureNode } from 'three/webgpu'
import { traa } from 'three/addons/tsl/display/TRAANode.js'


export interface TraaOptions {
  depthThreshold?:        number
  edgeDepthDiff?:         number
  maxVelocityLength?:     number
  useSubpixelCorrection?: boolean
}

// `beautyNode` is the colour to resolve (often the composited GI/SSS output),
// `depthNode` + `velocityNode` are the matching MRT texture nodes.
export function createTraa (
  beautyNode: Node,
  depthNode: TextureNode,
  velocityNode: TextureNode,
  camera: Camera,
  options: TraaOptions = {},
) {
  const node = traa(beautyNode, depthNode, velocityNode, camera)
  if (options.depthThreshold !== undefined)
    node.depthThreshold = options.depthThreshold
  if (options.edgeDepthDiff !== undefined)
    node.edgeDepthDiff = options.edgeDepthDiff
  if (options.maxVelocityLength !== undefined)
    node.maxVelocityLength = options.maxVelocityLength
  if (options.useSubpixelCorrection !== undefined)
    node.useSubpixelCorrection = options.useSubpixelCorrection
  return node
}

// perf: medium. One history blend; the camera-jitter bookkeeping is internal.
