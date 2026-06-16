import * as THREE from 'three';
import { PostProcessing } from 'three/webgpu';
import type { Renderer, Node } from 'three/webgpu';
import type { ScenePassTargets } from './types.js';
export declare function createScenePass(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
export declare function createScenePassMRT(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
export declare function createScenePassVelocity(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createScenePassEmissive(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createScenePassSSR(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createPostProcessing(renderer: Renderer, outputNode: Node): PostProcessing;
//# sourceMappingURL=pipeline.d.ts.map