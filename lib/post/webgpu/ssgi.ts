// lib/post/webgpu/ssgi.ts
// Screen-space global illumination — ray-marches the depth/normal buffers to add
// one bounce of indirect light + AO from on-screen geometry. Wraps three's
// SSGINode. Pattern: GEOMETRY-AWARE effect; the scene pass needs an MRT with
// normal (+ velocity for temporal filtering). Typically followed by TRAA.
// (examples: webgpu_postprocessing_ssgi, .../ssgi_ballpool.)

import type { Node, PerspectiveCamera } from 'three/webgpu'
import { ssgi } from 'three/addons/tsl/display/SSGINode.js'




/** Options for {@link createSsgi}: slice/step counts, AO/GI intensity, radius, screen-space sampling, thickness, backface lighting, and temporal filtering. */
export interface SsgiOptions {
  sliceCount?:             number
  stepCount?:              number
  aoIntensity?:            number
  giIntensity?:            number
  radius?:                 number
  useScreenSpaceSampling?: boolean
  expFactor?:              number
  thickness?:              number
  useLinearThickness?:     boolean
  backfaceLighting?:       number
  useTemporalFiltering?:   boolean
}

// `beautyNode` is the lit scene colour, `normalNode` the decoded view normal.
// SSGI requires a PerspectiveCamera. The ssgi/ballpool example only differs in
// its (skipped) physics demo scene; the effect factory is identical.


/**
 * Ray-march the depth and normal buffers to add one bounce of indirect light plus screen-space ambient occlusion.
 *
 * @param beautyNode - The lit scene colour node.
 * @param depthNode - The depth node from the scene pass.
 * @param normalNode - The decoded view-space normal node.
 * @param camera - The active camera (must be a {@link PerspectiveCamera}).
 * @param options.sliceCount - Number of slices for the multi-slice hemisphere raymarch.
 * @param options.stepCount - Steps per slice.
 * @param options.aoIntensity - Ambient occlusion contribution strength.
 * @param options.giIntensity - Indirect-light contribution strength.
 * @param options.radius - Ray-march radius in world units.
 * @param options.useScreenSpaceSampling - Sample screen-space neighbours instead of reprojection.
 * @param options.expFactor - Exponential distance-weighting factor.
 * @param options.thickness - Surface-thickness heuristic to reduce self-occlusion.
 * @param options.useLinearThickness - Whether thickness is in linear (vs logarithmic) space.
 * @param options.backfaceLighting - How much back-facing geometry contributes to indirect light.
 * @param options.useTemporalFiltering - Enable temporal reprojection to reduce noise across frames.
 * @returns An SSGINode producing the GI + AO contribution.
 * @remarks Requires the WebGPU renderer (three/webgpu). The scene pass needs an MRT with normals (see {@link createScenePassMRT}). Typically followed by TRAA for temporal denoising. Very high cost — reduce sliceCount/stepCount on anything but high-end desktop GPUs.
 */
export function createSsgi (
  beautyNode: Node,
  depthNode: Node,
  normalNode: Node,
  camera: PerspectiveCamera,
  options: SsgiOptions = {},
) {
  const node = ssgi(beautyNode, depthNode, normalNode, camera)
  if (options.sliceCount !== undefined)
    node.sliceCount.value = options.sliceCount
  if (options.stepCount !== undefined)
    node.stepCount.value = options.stepCount
  if (options.aoIntensity !== undefined)
    node.aoIntensity.value = options.aoIntensity
  if (options.giIntensity !== undefined)
    node.giIntensity.value = options.giIntensity
  if (options.radius !== undefined)
    node.radius.value = options.radius
  if (options.useScreenSpaceSampling !== undefined)
    node.useScreenSpaceSampling.value = options.useScreenSpaceSampling
  if (options.expFactor !== undefined)
    node.expFactor.value = options.expFactor
  if (options.thickness !== undefined)
    node.thickness.value = options.thickness
  if (options.useLinearThickness !== undefined)
    node.useLinearThickness.value = options.useLinearThickness
  if (options.backfaceLighting !== undefined)
    node.backfaceLighting.value = options.backfaceLighting
  if (options.useTemporalFiltering !== undefined)
    node.useTemporalFiltering = options.useTemporalFiltering
  return node
}

// perf: very high. Multi-slice hemisphere ray-march; pair with TRAA and lower
// sliceCount/stepCount on anything but high-end desktop GPUs.
