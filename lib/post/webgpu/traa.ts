// lib/post/webgpu/traa.ts
// Temporal reprojection anti-aliasing — jitters the camera each frame and blends
// history reprojected by per-pixel velocity, resolving sub-pixel edges and
// denoising stochastic effects (SSGI/SSS). Wraps three's TRAANode. Pattern:
// GEOMETRY-AWARE effect; the scene pass needs depth + a `velocity` MRT channel.

import type { Camera, Node, TextureNode } from 'three/webgpu'
import { traa } from 'three/addons/tsl/display/TRAANode.js'




/** Options for {@link createTraa}: depth threshold, edge depth diff, max velocity, and subpixel correction. */
export interface TraaOptions {
  depthThreshold?:        number
  edgeDepthDiff?:         number
  maxVelocityLength?:     number
  useSubpixelCorrection?: boolean
}

// `beautyNode` is the colour to resolve (often the composited GI/SSS output),
// `depthNode` + `velocityNode` are the matching MRT texture nodes.


/**
 * Apply temporal reprojection anti-aliasing: jitter the camera each frame and blend reprojected history via per-pixel screen-space velocity.
 *
 * @param beautyNode - The colour to resolve (typically the composited GI/SSS output).
 * @param depthNode - The depth-texture node from the scene pass.
 * @param velocityNode - The velocity-texture node from the scene pass (see {@link createScenePassVelocity}).
 * @param camera - The active camera.
 * @param options.depthThreshold - Depth-discontinuity threshold for history rejection.
 * @param options.edgeDepthDiff - Edge-depth difference threshold.
 * @param options.maxVelocityLength - Maximum per-pixel velocity length clamp.
 * @param options.useSubpixelCorrection - Enable subpixel correction for finer detail.
 * @returns A TRAANode producing the resolved output.
 * @remarks Requires the WebGPU renderer (three/webgpu). The scene pass needs depth + a `velocity` MRT channel (see {@link createScenePassVelocity}). Also denoises stochastic effects from SSGI/SSS. Medium cost — one history blend; camera-jitter bookkeeping is internal.
 */
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
