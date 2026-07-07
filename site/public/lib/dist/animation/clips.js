// lib/animation/clips.ts
// Programmatic AnimationClip builders. three's animation system plays clips
// (https://threejs.org/manual/#en/animation-system); these helpers author
// clips in code — spin/bob/pulse loops plus raw keyframe-track constructors —
// so procedural props can animate without an imported .glb.
import * as THREE from 'three';
export function numberTrack(targetPath, times, values) {
    return new THREE.NumberKeyframeTrack(targetPath, times, values);
}
export function vectorTrack(targetPath, times, values) {
    return new THREE.VectorKeyframeTrack(targetPath, times, values);
}
export function quaternionTrack(targetPath, times, values) {
    return new THREE.QuaternionKeyframeTrack(targetPath, times, values);
}
export function trackFromKeyframes(spec) {
    switch (spec.type) {
        case 'vector': return vectorTrack(spec.path, spec.times, spec.values);
        case 'quaternion': return quaternionTrack(spec.path, spec.times, spec.values);
        default: return numberTrack(spec.path, spec.times, spec.values);
    }
}
export function clipFromTracks(name, duration, tracks) {
    return new THREE.AnimationClip(name, duration, tracks);
}
const axisVec = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
/** Continuous 360° rotation around `axis`. Loops seamlessly. */
export function spinClip(axis = 'y', duration = 4, name = 'spin') {
    const q = new THREE.Quaternion();
    const times = [0, duration / 3, 2 * duration / 3, duration];
    const values = [];
    times.forEach((_, i) => {
        q.setFromAxisAngle(axisVec[axis], i / 3 * Math.PI * 2);
        values.push(q.x, q.y, q.z, q.w);
    });
    return clipFromTracks(name, duration, [quaternionTrack('.quaternion', times, values)]);
}
/** Vertical bob (sine, seamless loop). `amp` in world units. */
export function bobClip(amp = 0.3, duration = 2, name = 'bob') {
    const times = [0, duration / 4, duration / 2, 3 * duration / 4, duration];
    const values = [0, 0, 0, amp, 0, 0, 0, 0, 0, -amp, 0, 0, 0, 0, 0];
    const track = vectorTrack('.position', times, values);
    return clipFromTracks(name, duration, [track]);
}
/** Uniform scale pulse between `min` and `max`. */
export function pulseScaleClip(min = 0.9, max = 1.1, duration = 1.5, name = 'pulse') {
    const times = [0, duration / 2, duration];
    const values = [min, min, min, max, max, max, min, min, min];
    return clipFromTracks(name, duration, [vectorTrack('.scale', times, values)]);
}
export function combineClips(name, clips) {
    const tracks = clips.flatMap(c => c.tracks);
    const duration = Math.max(...clips.map(c => c.duration));
    return new THREE.AnimationClip(name, duration, tracks);
}
// perf: clips are plain data; the GPU cost is whatever the bound property drives.
// Keyframe interpolation is cheap CPU work inside AnimationMixer.update().
//# sourceMappingURL=clips.js.map