import * as THREE from 'three';
import type { Disposable, FrameContext } from '../types.js';
export interface ShaderQuadOptions {
    /** Fragment shader. Receives iResolution, iTime, uPointer + your uniforms. */
    fragmentShader: string;
    /** Extra uniforms merged into the standard set. */
    uniforms?: Record<string, THREE.IUniform>;
    /** Track pointer position on this element into uPointer. */
    pointerElement?: HTMLElement;
}
export interface ShaderQuad extends Disposable {
    scene: THREE.Scene;
    camera: THREE.OrthographicCamera;
    material: THREE.ShaderMaterial;
    /** Advance iTime and (if sizeable) iResolution. Call once per frame. */
    update(ctx: FrameContext, renderer: THREE.WebGLRenderer): void;
    /** update + renderer.render in one call, for shader-only scenes. */
    render(ctx: FrameContext, renderer: THREE.WebGLRenderer): void;
}
export declare function createShaderQuad({ fragmentShader, uniforms, pointerElement }: ShaderQuadOptions): ShaderQuad;
//# sourceMappingURL=shader-quad.d.ts.map