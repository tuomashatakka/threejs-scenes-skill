// lib/post/webgpu/anamorphic.ts
// Anamorphic lens flare — horizontal streaks from bright highlights, the classic
// sci-fi blue bar. Wraps three's AnamorphicNode. Pattern: COLOUR-INPUT effect;
// add the streak contribution back onto the scene colour (optionally * intensity).
import { uniform } from 'three/tsl';
import { anamorphic } from 'three/addons/tsl/display/AnamorphicNode.js';
export function createAnamorphic(input, options = {}) {
    const { threshold = 1.4, scale = 5, samples = 32, resolutionScale = 1 } = options;
    const node = anamorphic(input, uniform(threshold), uniform(scale), samples);
    node.resolutionScale = resolutionScale;
    return node;
}
// perf: medium. Cost scales with samples; drop resolutionScale to recover it.
//# sourceMappingURL=anamorphic.js.map