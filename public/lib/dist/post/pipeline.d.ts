import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import type { Pass } from 'three/addons/postprocessing/Pass.js';
import type { Disposable } from '../types.js';
export interface PostPipelineOptions {
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.Camera;
    width: number;
    height: number;
    /** Attach a DepthTexture for depth-sampling passes (dof, god rays). */
    withDepth?: boolean;
}
export interface PostPipeline extends Disposable {
    composer: EffectComposer;
    /** Register a named pass. Order of registration = default chain order. */
    register(name: string, pass: Pass): void;
    /** Reorder the chain. Unknown names are ignored; unlisted passes go last. */
    setOrder(order: readonly string[]): void;
    setEnabled(flags: Readonly<Record<string, boolean>>): void;
    getOrder(): string[];
    get(name: string): Pass | undefined;
    render(delta?: number): void;
    setSize(width: number, height: number): void;
}
export declare function createPostPipeline({ renderer, scene, camera, width, height, withDepth, }: PostPipelineOptions): PostPipeline;
//# sourceMappingURL=pipeline.d.ts.map