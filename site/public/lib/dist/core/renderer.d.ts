import * as THREE from 'three';
export interface RendererOptions {
    canvas: HTMLCanvasElement;
    antialias?: boolean;
    pixelRatioMax?: number;
    shadows?: boolean;
    toneMapping?: THREE.ToneMapping;
    toneMappingExposure?: number;
    /** For scenes spanning huge depth ranges (space scale -> surface scale). */
    logarithmicDepthBuffer?: boolean;
}
export declare function createRenderer({ canvas, antialias, pixelRatioMax, shadows, toneMapping, toneMappingExposure, logarithmicDepthBuffer, }: RendererOptions): THREE.WebGLRenderer;
export type ResizeHandler = (width: number, height: number) => void;
export declare function attachResizeObserver(renderer: THREE.WebGLRenderer, camera: THREE.Camera, canvas: HTMLCanvasElement, onResize?: ResizeHandler): () => void;
//# sourceMappingURL=renderer.d.ts.map