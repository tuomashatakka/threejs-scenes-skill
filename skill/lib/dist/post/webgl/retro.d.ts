import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface RetroOptions {
    pixelSize?: number;
    colorLevels?: number;
    scanlineIntensity?: number;
}
export interface RetroPass extends ShaderPass {
    setSize(width: number, height: number): void;
}
export declare function createRetroPass(options?: RetroOptions): RetroPass;
//# sourceMappingURL=retro.d.ts.map