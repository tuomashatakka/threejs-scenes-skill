// lib/post/webgpu/pixel.ts
// Pixelation — renders the scene into chunky pixels with optional normal/depth
// edge outlines, a crisp retro / voxel-art look. Wraps three's pixelationPass,
// which is itself a PassNode (it renders the scene), so use it INSTEAD of a plain
// scene pass. Pattern: SCENE PASS replacement; use the returned node as output.
import { uniform } from 'three/tsl';
import { pixelationPass } from 'three/addons/tsl/display/PixelationPassNode.js';
export function createPixelationPass(scene, camera, options = {}) {
    const { pixelSize = 6, normalEdgeStrength = 0.3, depthEdgeStrength = 0.4 } = options;
    return pixelationPass(scene, camera, uniform(pixelSize), uniform(normalEdgeStrength), uniform(depthEdgeStrength));
}
// perf: medium. Renders the scene at reduced resolution plus an edge-detect pass.
//# sourceMappingURL=pixel.js.map