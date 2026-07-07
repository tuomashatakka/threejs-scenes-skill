// lib/post/webgpu/masking.ts
// Stencil-style masking — composite textures into the screen regions covered by
// helper "mask" scenes, using each mask pass's alpha. No dedicated node; this
// mirrors the example (webgpu_postprocessing_masking) with a TSL mix chain.
// Pattern: MULTI-PASS composition.
import { mix, pass, texture } from 'three/tsl';
// Composites each layer onto `base` in order, using the alpha of pass(scene) as
// the mask. Returns the composed colour node to use as output.
export function createMasking(base, camera, layers) {
    let compose = base;
    for (const layer of layers) {
        const maskAlpha = pass(layer.scene, camera).getTextureNode().a;
        compose = mix(compose, texture(layer.texture), maskAlpha);
    }
    return compose;
}
// perf: medium. One extra render pass per mask layer.
//# sourceMappingURL=masking.js.map