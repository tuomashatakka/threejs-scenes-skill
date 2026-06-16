// lib/post/webgpu/afterimage.ts
// After-image / echo trail — blends each frame with a damped copy of the last,
// leaving motion ghosts. Wraps three's AfterImageNode. Pattern: COLOUR-INPUT
// effect that keeps its own history target. Use the result as the output node.
import { afterImage } from 'three/addons/tsl/display/AfterImageNode.js';
export function createAfterImage(input, options = {}) {
    const { damp = 0.8 } = options;
    return afterImage(input, damp);
}
// perf: low. One extra full-screen blend against a retained history texture.
//# sourceMappingURL=afterimage.js.map