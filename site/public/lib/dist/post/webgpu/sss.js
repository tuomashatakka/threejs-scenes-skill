// lib/post/webgpu/sss.ts
// Screen-space subsurface scattering — approximates light bleeding through thin
// translucent surfaces (skin, wax, leaves) by ray-marching shadow depth toward
// the main light. Wraps three's SSSNode. Pattern: GEOMETRY-AWARE effect; needs a
// depth (velocity-MRT) pre-pass, the camera and the main DirectionalLight
// (example: webgpu_postprocessing_sss). Returns a scalar mask in `.r`.
import { sss } from 'three/addons/tsl/display/SSSNode.js';
// `depthNode` is the pre-pass depth texture node. Sample the result and use its
// `.r` channel as the scattering term added into the lit colour.
export function createSss(depthNode, camera, mainLight, options = {}) {
    const node = sss(depthNode, camera, mainLight);
    if (options.maxDistance !== undefined)
        node.maxDistance.value = options.maxDistance;
    if (options.thickness !== undefined)
        node.thickness.value = options.thickness;
    if (options.shadowIntensity !== undefined)
        node.shadowIntensity.value = options.shadowIntensity;
    if (options.quality !== undefined)
        node.quality.value = options.quality;
    if (options.resolutionScale !== undefined)
        node.resolutionScale = options.resolutionScale;
    if (options.useTemporalFiltering !== undefined)
        node.useTemporalFiltering = options.useTemporalFiltering;
    return node;
}
// perf: high. Per-pixel shadow ray-march; pair with TRAA when temporal filtering.
//# sourceMappingURL=sss.js.map