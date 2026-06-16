// lib/post/webgpu/motion-blur.ts
// Per-pixel motion blur — smears colour along each pixel's screen-space velocity.
// Wraps three's motionBlur. Pattern: COLOUR + VELOCITY effect; the scene pass
// must expose a `velocity` MRT channel (use the TSL `velocity` node).
import { int } from 'three/tsl';
import { motionBlur } from 'three/addons/tsl/display/MotionBlur.js';
// `velocityNode` is the scene pass's velocity texture node, typically scaled by a
// blur-amount uniform (scenePass.getTextureNode('velocity').mul(amount)).
export function createMotionBlur(input, velocityNode, options = {}) {
    const { numSamples } = options;
    return numSamples === undefined
        ? motionBlur(input, velocityNode)
        : motionBlur(input, velocityNode, int(numSamples));
}
// perf: medium. Cost scales with numSamples; needs the extra velocity attachment.
//# sourceMappingURL=motion-blur.js.map