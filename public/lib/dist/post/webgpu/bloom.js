// lib/post/webgpu/bloom.ts
// Bloom — spreads light from bright pixels for a glow. Wraps three's BloomNode.
// Pattern: COLOUR-INPUT effect. Add the result onto the scene colour.
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
// Returns the bloom contribution node. Compose with `input.add(createBloom(...))`
// or assign directly if you want bloom-only output.
export function createBloom(input, options = {}) {
    const { strength = 1, radius = 0, threshold = 0 } = options;
    return bloom(input, strength, radius, threshold);
}
// perf: medium. Multi-pass downsample/upsample blur at reduced resolution.
//# sourceMappingURL=bloom.js.map