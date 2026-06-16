import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface FilmGrainOptions {
    intensity?: number;
    luma?: number;
    desat?: number;
}
export declare function createFilmGrainPass({ intensity, luma, desat, }?: FilmGrainOptions): ShaderPass;
//# sourceMappingURL=film-grain-pass.d.ts.map