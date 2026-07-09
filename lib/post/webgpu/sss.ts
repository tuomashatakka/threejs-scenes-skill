// lib/post/webgpu/sss.ts
// Screen-space subsurface scattering — approximates light bleeding through thin
// translucent surfaces (skin, wax, leaves) by ray-marching shadow depth toward
// the main light. Wraps three's SSSNode. Pattern: GEOMETRY-AWARE effect; needs a
// depth (velocity-MRT) pre-pass, the camera and the main DirectionalLight
// (example: webgpu_postprocessing_sss). Returns a scalar mask in `.r`.

import type { Camera, DirectionalLight, TextureNode } from 'three/webgpu'
import { sss } from 'three/addons/tsl/display/SSSNode.js'




/** Options for {@link createSss}: max distance, thickness, shadow intensity, quality, resolution scale, and temporal filtering. */
export interface SssOptions {
  maxDistance?:          number
  thickness?:            number
  shadowIntensity?:      number
  quality?:              number
  resolutionScale?:      number
  useTemporalFiltering?: boolean
}

// `depthNode` is the pre-pass depth texture node. Sample the result and use its
// `.r` channel as the scattering term added into the lit colour.


/**
 * Approximate subsurface scattering by ray-marching shadow depth toward the main directional light, simulating light bleeding through thin translucent surfaces (skin, wax, leaves).
 *
 * @param depthNode - The prepass depth-texture node.
 * @param camera - The active camera.
 * @param mainLight - The primary {@link DirectionalLight} driving the scattering direction.
 * @param options.maxDistance - Maximum ray-march distance from the surface.
 * @param options.thickness - Surface-thickness heuristic.
 * @param options.shadowIntensity - Intensity of the scattering shadow term.
 * @param options.quality - Ray-march quality level.
 * @param options.resolutionScale - Fraction of full resolution for the scattering buffer.
 * @param options.useTemporalFiltering - Enable temporal reprojection to reduce noise.
 * @returns An SSSNode returning a scattering mask in its `.r` channel. Add the term into the lit colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). Needs a depth (velocity-MRT) prepass. High cost — pair with TRAA when temporal filtering is enabled.
 */
export function createSss (
  depthNode: TextureNode,
  camera: Camera,
  mainLight: DirectionalLight,
  options: SssOptions = {},
) {
  const node = sss(depthNode, camera, mainLight)
  if (options.maxDistance !== undefined)
    node.maxDistance.value = options.maxDistance
  if (options.thickness !== undefined)
    node.thickness.value = options.thickness
  if (options.shadowIntensity !== undefined)
    node.shadowIntensity.value = options.shadowIntensity
  if (options.quality !== undefined)
    node.quality.value = options.quality
  if (options.resolutionScale !== undefined)
    node.resolutionScale = options.resolutionScale
  if (options.useTemporalFiltering !== undefined)
    node.useTemporalFiltering = options.useTemporalFiltering
  return node
}

// perf: high. Per-pixel shadow ray-march; pair with TRAA when temporal filtering.
