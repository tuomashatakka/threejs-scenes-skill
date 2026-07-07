import type { Node, PassNode } from 'three/webgpu';
export type ColorNode = Node;
export interface ScenePassTargets {
    pass: PassNode;
    color: Node;
    viewZ: Node;
    normal: Node;
}
export type ColorEffect<Options> = (input: ColorNode, options?: Options) => Node;
//# sourceMappingURL=types.d.ts.map