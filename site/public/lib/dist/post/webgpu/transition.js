// lib/post/webgpu/transition.ts
// Scene transition — cross-fades two scene passes, optionally masked by a
// transition texture for wipes/dissolves. Wraps three's TransitionNode. Pattern:
// MULTI-PASS composition (two scene passes + a mix texture).
import { transition } from 'three/addons/tsl/display/TransitionNode.js';
// `passA` / `passB` are two scene pass colour nodes; `mixTexture` is the wipe
// pattern texture node. Returns the blended colour node to use as output.
export function createTransition(passA, passB, mixTexture, options = {}) {
    const { mixRatio = 0, threshold = 0.1, useTexture = 1 } = options;
    return transition(passA, passB, mixTexture, mixRatio, threshold, useTexture);
}
// perf: medium. Two scene renders during the transition window.
//# sourceMappingURL=transition.js.map