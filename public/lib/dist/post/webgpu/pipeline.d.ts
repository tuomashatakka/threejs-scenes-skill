import * as THREE from 'three';
import { RenderPipeline } from 'three/webgpu';
import type { Renderer, Node } from 'three/webgpu';
import type { ScenePassTargets } from './types.js';
export declare function createScenePass(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
export declare function createScenePassMRT(scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets;
export declare function createScenePassVelocity(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createScenePassEmissive(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createScenePassSSR(scene: THREE.Scene, camera: THREE.Camera): import("three/webgpu").PassNode;
export declare function createRenderPipeline(renderer: Renderer, outputNode: Node): RenderPipeline;
/**
 * @deprecated Renamed to {@link createRenderPipeline}. PostProcessing was renamed
 * to RenderPipeline in three.js r183; this alias is kept for back-compat and will
 * be removed alongside three's PostProcessing wrapper.
 */
export declare const createPostProcessing: typeof createRenderPipeline;
//# sourceMappingURL=pipeline.d.ts.map