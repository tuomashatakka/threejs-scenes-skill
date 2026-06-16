// lib/post/webgpu/difference.ts
// Frame difference — boosts saturation where the current frame differs from the
// previous one, highlighting motion. No dedicated node exists; this mirrors the
// example with a TSL composition over the scene pass's current + previous
// texture nodes. Pattern: SCENE-PASS effect (needs the PassNode, not just a
// colour node, to read the retained previous-frame texture).
import { luminance, saturation } from 'three/tsl';
// Pass the scene PassNode (from createScenePass(...).pass). Returns the
// motion-highlighted colour node to use as output.
export function createDifference(scenePass, options = {}) {
    const { gain = 1000, maxSaturation = 3 } = options;
    const current = scenePass.getTextureNode();
    const previous = scenePass.getPreviousTextureNode();
    const frameDiff = previous.sub(current).abs();
    const saturationAmount = luminance(frameDiff).mul(gain)
        .clamp(0, maxSaturation);
    return saturation(current, saturationAmount);
}
// perf: low. One extra retained texture and a luminance/saturation pair.
//# sourceMappingURL=difference.js.map