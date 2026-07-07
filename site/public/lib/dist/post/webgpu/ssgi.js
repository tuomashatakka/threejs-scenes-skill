// lib/post/webgpu/ssgi.ts
// Screen-space global illumination — ray-marches the depth/normal buffers to add
// one bounce of indirect light + AO from on-screen geometry. Wraps three's
// SSGINode. Pattern: GEOMETRY-AWARE effect; the scene pass needs an MRT with
// normal (+ velocity for temporal filtering). Typically followed by TRAA.
// (examples: webgpu_postprocessing_ssgi, .../ssgi_ballpool.)
import { ssgi } from 'three/addons/tsl/display/SSGINode.js';
// `beautyNode` is the lit scene colour, `normalNode` the decoded view normal.
// SSGI requires a PerspectiveCamera. The ssgi/ballpool example only differs in
// its (skipped) physics demo scene; the effect factory is identical.
export function createSsgi(beautyNode, depthNode, normalNode, camera, options = {}) {
    const node = ssgi(beautyNode, depthNode, normalNode, camera);
    if (options.sliceCount !== undefined)
        node.sliceCount.value = options.sliceCount;
    if (options.stepCount !== undefined)
        node.stepCount.value = options.stepCount;
    if (options.aoIntensity !== undefined)
        node.aoIntensity.value = options.aoIntensity;
    if (options.giIntensity !== undefined)
        node.giIntensity.value = options.giIntensity;
    if (options.radius !== undefined)
        node.radius.value = options.radius;
    if (options.useScreenSpaceSampling !== undefined)
        node.useScreenSpaceSampling.value = options.useScreenSpaceSampling;
    if (options.expFactor !== undefined)
        node.expFactor.value = options.expFactor;
    if (options.thickness !== undefined)
        node.thickness.value = options.thickness;
    if (options.useLinearThickness !== undefined)
        node.useLinearThickness.value = options.useLinearThickness;
    if (options.backfaceLighting !== undefined)
        node.backfaceLighting.value = options.backfaceLighting;
    if (options.useTemporalFiltering !== undefined)
        node.useTemporalFiltering = options.useTemporalFiltering;
    return node;
}
// perf: very high. Multi-slice hemisphere ray-march; pair with TRAA and lower
// sliceCount/stepCount on anything but high-end desktop GPUs.
//# sourceMappingURL=ssgi.js.map