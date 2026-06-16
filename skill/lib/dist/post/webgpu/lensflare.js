// lib/post/webgpu/lensflare.ts
// Screen-space lens flare — ghost reflections + halo from bright spots. Wraps
// three's LensflareNode. Pattern: COLOUR-INPUT effect, typically fed the bloom
// of an emissive MRT channel (example: webgpu_postprocessing_lensflare). Add the
// flare contribution onto the scene colour.
import { uniform } from 'three/tsl';
import { lensflare } from 'three/addons/tsl/display/LensflareNode.js';
export function createLensflare(input, options = {}) {
    const params = {};
    if (options.ghostTint !== undefined)
        params.ghostTint = options.ghostTint;
    if (options.threshold !== undefined)
        params.threshold = uniform(options.threshold);
    if (options.ghostSamples !== undefined)
        params.ghostSamples = uniform(options.ghostSamples);
    if (options.ghostSpacing !== undefined)
        params.ghostSpacing = uniform(options.ghostSpacing);
    if (options.ghostAttenuationFactor !== undefined)
        params.ghostAttenuationFactor = uniform(options.ghostAttenuationFactor);
    if (options.downSampleRatio !== undefined)
        params.downSampleRatio = options.downSampleRatio;
    return lensflare(input, params);
}
// perf: medium. Downsampled ghost accumulation; raise downSampleRatio if costly.
//# sourceMappingURL=lensflare.js.map