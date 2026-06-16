import type { PassNode } from 'three/webgpu';
export interface DifferenceOptions {
    gain?: number;
    maxSaturation?: number;
}
export declare function createDifference(scenePass: PassNode, options?: DifferenceOptions): import("three/webgpu").Node<"vec3">;
//# sourceMappingURL=difference.d.ts.map