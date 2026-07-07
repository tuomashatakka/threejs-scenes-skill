import * as THREE from 'three';
import type { Node } from 'three/webgpu';
export interface MaskLayer {
    scene: THREE.Scene;
    texture: THREE.Texture;
}
export declare function createMasking(base: Node<'vec4'>, camera: THREE.Camera, layers: MaskLayer[]): Node;
//# sourceMappingURL=masking.d.ts.map