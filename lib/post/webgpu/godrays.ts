// lib/post/webgpu/godrays.ts
// God rays / volumetric light shafts — ray-marches the depth buffer from a light
// to scatter brightness along its rays. Wraps three's GodraysNode. Pattern:
// GEOMETRY-AWARE effect (needs the pass depth texture node + camera + light).

import type { Camera, DirectionalLight, PointLight, TextureNode } from 'three/webgpu'
import { godrays } from 'three/addons/tsl/display/GodraysNode.js'




/** Options for {@link createGodrays}: raymarch step count, scattering density, max density, distance attenuation, and resolution scale. */
export interface GodraysOptions {
  raymarchSteps?:       number
  density?:             number
  maxDensity?:          number
  distanceAttenuation?: number
  resolutionScale?:     number
}

// `depthNode` is the scene pass's depth texture (scenePass.getTextureNode('depth')).
// Composite the returned node's texture over the scene colour (the example uses
// a bilateral blur + depth-aware blend, omitted here — see TODO).


/**
 * Ray-march the depth buffer from a directional or point light to produce volumetric light shafts (god rays).
 *
 * @param depthNode - Scene-pass depth-texture node (scenePass.getTextureNode('depth')).
 * @param camera - The active camera.
 * @param light - The light source casting rays ({@link DirectionalLight} or {@link PointLight}).
 * @param options.raymarchSteps - Number of raymarch steps; higher = smoother but costlier.
 * @param options.density - Scattering density along each ray.
 * @param options.maxDensity - Maximum scattering-density clamp.
 * @param options.distanceAttenuation - Distance-based attenuation of the light contribution.
 * @param options.resolutionScale - Fraction of full resolution for the raymarch buffer.
 * @returns A GodraysNode whose texture should be composited over the scene colour.
 * @remarks Requires the WebGPU renderer (three/webgpu). High cost — scales with raymarchSteps; drop resolutionScale to recover performance.
 */
export function createGodrays (
  depthNode: TextureNode,
  camera: Camera,
  light: DirectionalLight | PointLight,
  options: GodraysOptions = {},
) {
  const node = godrays(depthNode, camera, light)
  if (options.raymarchSteps !== undefined)
    node.raymarchSteps.value = options.raymarchSteps
  if (options.density !== undefined)
    node.density.value = options.density
  if (options.maxDensity !== undefined)
    node.maxDensity.value = options.maxDensity
  if (options.distanceAttenuation !== undefined)
    node.distanceAttenuation.value = options.distanceAttenuation
  if (options.resolutionScale !== undefined)
    node.resolutionScale = options.resolutionScale
  return node
}

// perf: high. Cost scales with raymarchSteps; drop resolutionScale to recover it.
// TODO: the example (webgpu_postprocessing_godrays) refines the rays with
// bilateralBlur + depthAwareBlend before compositing; add those if you need the
// softened look — both helpers live in three/addons/tsl/display.
