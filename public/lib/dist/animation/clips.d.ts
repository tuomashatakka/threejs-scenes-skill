import * as THREE from 'three';
export declare function numberTrack(targetPath: string, times: number[], values: number[]): THREE.NumberKeyframeTrack;
export declare function vectorTrack(targetPath: string, times: number[], values: number[]): THREE.VectorKeyframeTrack;
export declare function quaternionTrack(targetPath: string, times: number[], values: number[]): THREE.QuaternionKeyframeTrack;
export interface TrackSpec {
    path: string;
    times: number[];
    values: number[];
    type?: 'number' | 'vector' | 'quaternion';
}
export declare function trackFromKeyframes(spec: TrackSpec): THREE.KeyframeTrack;
export declare function clipFromTracks(name: string, duration: number, tracks: THREE.KeyframeTrack[]): THREE.AnimationClip;
/** Continuous 360° rotation around `axis`. Loops seamlessly. */
export declare function spinClip(axis?: 'x' | 'y' | 'z', duration?: number, name?: string): THREE.AnimationClip;
/** Vertical bob (sine, seamless loop). `amp` in world units. */
export declare function bobClip(amp?: number, duration?: number, name?: string): THREE.AnimationClip;
/** Uniform scale pulse between `min` and `max`. */
export declare function pulseScaleClip(min?: number, max?: number, duration?: number, name?: string): THREE.AnimationClip;
export declare function combineClips(name: string, clips: THREE.AnimationClip[]): THREE.AnimationClip;
//# sourceMappingURL=clips.d.ts.map