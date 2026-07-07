// lib/post/webgpu/radial-blur.ts
// Radial (zoom) blur — streaks the image outward from a centre point, the
// classic speed / hyperspace look. Wraps three's radialBlur. Pattern:
// COLOUR-INPUT effect; use the result directly as output.
import { float, int, uniform } from 'three/tsl';
import { radialBlur } from 'three/addons/tsl/display/radialBlur.js';
export function createRadialBlur(input, options = {}) {
    const { weight = 0.9, decay = 0.95, exposure = 5, count = 32 } = options;
    return radialBlur(input, {
        weight: uniform(float(weight)),
        decay: uniform(float(decay)),
        exposure: uniform(int(exposure)),
        count: uniform(int(count)),
    });
}
// perf: medium. Cost scales linearly with `count` samples.
//# sourceMappingURL=radial-blur.js.map