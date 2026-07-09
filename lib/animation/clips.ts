// lib/animation/clips.ts
// Programmatic AnimationClip builders. three's animation system plays clips
// (https://threejs.org/manual/#en/animation-system); these helpers author
// clips in code — spin/bob/pulse loops plus raw keyframe-track constructors —
// so procedural props can animate without an imported .glb.

import * as THREE from 'three'


/** Build a `NumberKeyframeTrack` for `targetPath` (one value per keyframe time). */
export function numberTrack (targetPath: string, times: number[], values: number[]): THREE.NumberKeyframeTrack {
  return new THREE.NumberKeyframeTrack(targetPath, times, values)
}

/** Build a `VectorKeyframeTrack` for `targetPath` (three values per keyframe time). */
export function vectorTrack (targetPath: string, times: number[], values: number[]): THREE.VectorKeyframeTrack {
  return new THREE.VectorKeyframeTrack(targetPath, times, values)
}

/** Build a `QuaternionKeyframeTrack` for `targetPath` (four values per keyframe time, slerped). */
export function quaternionTrack (targetPath: string, times: number[], values: number[]): THREE.QuaternionKeyframeTrack {
  return new THREE.QuaternionKeyframeTrack(targetPath, times, values)
}

/** Declarative keyframe-track description consumed by {@link trackFromKeyframes}. `type` defaults to `'number'`. */
export interface TrackSpec {
  path:   string
  times:  number[]
  values: number[]
  type?:  'number' | 'vector' | 'quaternion'
}

/** Build the matching `KeyframeTrack` subclass from a {@link TrackSpec}. */
export function trackFromKeyframes (spec: TrackSpec): THREE.KeyframeTrack {
  switch (spec.type) {
    case 'vector': return vectorTrack(spec.path, spec.times, spec.values)
    case 'quaternion': return quaternionTrack(spec.path, spec.times, spec.values)
    default: return numberTrack(spec.path, spec.times, spec.values)
  }
}

/** Assemble tracks into a named `AnimationClip` of the given `duration` in seconds. */
export function clipFromTracks (name: string, duration: number, tracks: THREE.KeyframeTrack[]): THREE.AnimationClip {
  return new THREE.AnimationClip(name, duration, tracks)
}

const axisVec = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) }

/** Continuous 360° rotation around `axis`. Loops seamlessly. */
export function spinClip (axis: 'x' | 'y' | 'z' = 'y', duration = 4, name = 'spin'): THREE.AnimationClip {
  const q                = new THREE.Quaternion()
  const times            = [ 0, duration / 3, 2 * duration / 3, duration ]
  const values: number[] = []
  times.forEach((_, i) => {
    q.setFromAxisAngle(axisVec[axis], i / 3 * Math.PI * 2)
    values.push(q.x, q.y, q.z, q.w)
  })
  return clipFromTracks(name, duration, [ quaternionTrack('.quaternion', times, values) ])
}

/** Vertical bob (sine, seamless loop). `amp` in world units. */
export function bobClip (amp = 0.3, duration = 2, name = 'bob'): THREE.AnimationClip {
  const times  = [ 0, duration / 4, duration / 2, 3 * duration / 4, duration ]
  const values = [ 0, 0, 0, amp, 0, 0, 0, 0, 0, -amp, 0, 0, 0, 0, 0 ]
  const track  = vectorTrack('.position', times, values)
  return clipFromTracks(name, duration, [ track ])
}

/** Uniform scale pulse between `min` and `max`. */
export function pulseScaleClip (min = 0.9, max = 1.1, duration = 1.5, name = 'pulse'): THREE.AnimationClip {
  const times  = [ 0, duration / 2, duration ]
  const values = [ min, min, min, max, max, max, min, min, min ]
  return clipFromTracks(name, duration, [ vectorTrack('.scale', times, values) ])
}

/**
 * Merge several clips into one, layering all their tracks. The result's
 * duration is the longest input duration.
 *
 * @param name - Name of the combined clip.
 * @param clips - Clips whose tracks are concatenated; tracks targeting the
 * same property will fight — combine complementary clips (spin + bob).
 * @returns One `AnimationClip` playing every input in parallel.
 */
export function combineClips (name: string, clips: THREE.AnimationClip[]): THREE.AnimationClip {
  const tracks   = clips.flatMap(c => c.tracks)
  const duration = Math.max(...clips.map(c => c.duration))
  return new THREE.AnimationClip(name, duration, tracks)
}

// perf: clips are plain data; the GPU cost is whatever the bound property drives.
// Keyframe interpolation is cheap CPU work inside AnimationMixer.update().
