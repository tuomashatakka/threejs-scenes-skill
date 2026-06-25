// lib/post/webgl/outline.ts
// Selective object outlines — glowing edges around chosen meshes. Wraps three's
// official OutlinePass. Mirrors the WebGPU `outline` effect.
import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';
export function createOutline(ctx, options = {}) {
    const { selectedObjects = [], edgeStrength = 3, edgeGlow = 0, edgeThickness = 1, pulsePeriod = 0, visibleEdgeColor = '#ffffff', hiddenEdgeColor = '#190a05', } = options;
    const pass = new OutlinePass(new THREE.Vector2(ctx.width, ctx.height), ctx.scene, ctx.camera, selectedObjects);
    pass.edgeStrength = edgeStrength;
    pass.edgeGlow = edgeGlow;
    pass.edgeThickness = edgeThickness;
    pass.pulsePeriod = pulsePeriod;
    pass.visibleEdgeColor.set(visibleEdgeColor);
    pass.hiddenEdgeColor.set(hiddenEdgeColor);
    return pass;
}
// perf: medium. Extra depth/mask passes plus a separable blur for the glow.
//# sourceMappingURL=outline.js.map