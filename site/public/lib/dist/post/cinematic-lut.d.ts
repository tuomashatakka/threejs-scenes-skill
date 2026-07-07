import * as THREE from 'three';
export interface CinematicLutOptions {
    /** Contrast S-curve strength about mid-grey. Default 1.12. */
    contrast?: number;
    /** Split-tone strength: teal into shadows, amber into highlights. Default 1. */
    splitTone?: number;
    /** Saturation multiplier. Default 1.08. */
    saturation?: number;
}
/**
 * Build a cinematic colour-grading 3D LUT as a `Data3DTexture`: a gentle
 * S-curve for contrast, teal lifted into the shadows and warmth pushed into
 * the highlights (the classic "teal & orange" look), plus a saturation lift.
 */
export declare function createCinematicLUT(size?: number, { contrast, splitTone, saturation }?: CinematicLutOptions): THREE.Data3DTexture;
//# sourceMappingURL=cinematic-lut.d.ts.map