// lib/post/webgl/transition.ts
// Scene transition — blends between two scene/camera pairs, optionally masked by
// a texture. Wraps three's official RenderTransitionPass. Mirrors the WebGPU
// `transition` effect. Needs a SECOND scene/camera, so it skips WebGlPassContext.
import { RenderTransitionPass } from 'three/addons/postprocessing/RenderTransitionPass.js';
export function createTransition(sceneA, cameraA, sceneB, cameraB, options = {}) {
    const { transition = 0.5, texture, textureThreshold = 0.1 } = options;
    const pass = new RenderTransitionPass(sceneA, cameraA, sceneB, cameraB);
    pass.setTransition(transition);
    if (texture) {
        pass.setTexture(texture);
        pass.setTextureThreshold(textureThreshold);
        pass.useTexture(true);
    }
    return pass;
}
// perf: medium. Renders both scenes each frame, then blends.
//# sourceMappingURL=transition.js.map