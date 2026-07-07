// lib/post/webgpu/godrays.ts
// God rays / volumetric light shafts — ray-marches the depth buffer from a light
// to scatter brightness along its rays. Wraps three's GodraysNode. Pattern:
// GEOMETRY-AWARE effect (needs the pass depth texture node + camera + light).
import { godrays } from 'three/addons/tsl/display/GodraysNode.js';
// `depthNode` is the scene pass's depth texture (scenePass.getTextureNode('depth')).
// Composite the returned node's texture over the scene colour (the example uses
// a bilateral blur + depth-aware blend, omitted here — see TODO).
export function createGodrays(depthNode, camera, light, options = {}) {
    const node = godrays(depthNode, camera, light);
    if (options.raymarchSteps !== undefined)
        node.raymarchSteps.value = options.raymarchSteps;
    if (options.density !== undefined)
        node.density.value = options.density;
    if (options.maxDensity !== undefined)
        node.maxDensity.value = options.maxDensity;
    if (options.distanceAttenuation !== undefined)
        node.distanceAttenuation.value = options.distanceAttenuation;
    if (options.resolutionScale !== undefined)
        node.resolutionScale = options.resolutionScale;
    return node;
}
// perf: high. Cost scales with raymarchSteps; drop resolutionScale to recover it.
// TODO: the example (webgpu_postprocessing_godrays) refines the rays with
// bilateralBlur + depthAwareBlend before compositing; add those if you need the
// softened look — both helpers live in three/addons/tsl/display.
//# sourceMappingURL=godrays.js.map