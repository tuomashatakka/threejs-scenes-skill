import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
export interface HudBeamOptions {
    duration?: number;
    beamWidth?: number;
    beamColor?: THREE.ColorRepresentation;
    onComplete?: () => void;
}
export interface HudBeamTransition {
    pass: ShaderPass;
    play(onMidpoint?: () => void): void;
    tick(delta: number, time: number): void;
}
export declare function createHudBeamTransition({ duration, beamWidth, beamColor, onComplete, }?: HudBeamOptions): HudBeamTransition;
//# sourceMappingURL=hud-beam-transition.d.ts.map