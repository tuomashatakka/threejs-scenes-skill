// lib/post/webgpu/fxaa.ts
// FXAA — cheap fast-approximate anti-aliasing on the final image. Wraps three's
// FXAANode. Pattern: COLOUR-INPUT effect. Apply last, on display-space colour
// (the example feeds it `renderOutput(scenePass)`).
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';
export function createFxaa(input) {
    return fxaa(input);
}
// perf: low. Single edge-detect pass; no extra render targets.
//# sourceMappingURL=fxaa.js.map