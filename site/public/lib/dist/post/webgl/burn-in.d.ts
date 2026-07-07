import * as THREE from 'three';
import { Pass } from 'three/addons/postprocessing/Pass.js';
export interface BurnInOptions {
    /** History retention per frame, [0,1). 0.92 ≈ short ghost, 0.98 ≈ long smear. */
    decay?: number;
}
export declare class BurnInPass extends Pass {
    private historyA;
    private historyB;
    private blendQuad;
    private copyQuad;
    constructor(decay?: number);
    setDecay(decay: number): void;
    setSize(width: number, height: number): void;
    render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget): void;
    dispose(): void;
}
export declare function createBurnInPass({ decay }?: BurnInOptions): BurnInPass;
//# sourceMappingURL=burn-in.d.ts.map