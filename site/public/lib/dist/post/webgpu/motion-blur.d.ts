import type { Node } from 'three/webgpu';
export interface MotionBlurOptions {
    numSamples?: number;
}
export declare function createMotionBlur(input: Node, velocityNode: Node, options?: MotionBlurOptions): Node<"vec4">;
//# sourceMappingURL=motion-blur.d.ts.map