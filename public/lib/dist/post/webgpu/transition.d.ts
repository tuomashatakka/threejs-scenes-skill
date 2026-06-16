import type { Node } from 'three/webgpu';
export interface TransitionOptions {
    mixRatio?: number;
    threshold?: number;
    useTexture?: number;
}
export declare function createTransition(passA: Node, passB: Node, mixTexture: Node, options?: TransitionOptions): import("three/addons/tsl/display/TransitionNode.js").default;
//# sourceMappingURL=transition.d.ts.map