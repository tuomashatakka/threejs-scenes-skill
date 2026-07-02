// lib/procedural/segment-stream.ts
// Endless streaming world along a stitched path, generalized from shaders-fr's
// PathBuilder + RoomQueue. Append segments (any Object3D with local path
// control points and an exit); each is world-aligned so its local entrance
// tangent (+z) continues the previous segment's exit tangent, the shared
// CatmullRom curve is rebuilt, and the oldest segments beyond maxActive are
// evicted and disposed. Memory stays constant while the path grows forever.
// Drive a createPathCamera from the resulting { curve, total }.

import * as THREE from 'three'

import type { Vec3Tuple } from '../camera/targets.js'
import type { Disposable } from '../types.js'


export interface StreamSegmentInput {

  /** Segment content, authored in local space with the entrance at the origin facing +z. */
  object: THREE.Object3D

  /** Local-space path control points the camera should travel through. */
  pathPoints: Vec3Tuple[]

  /** Local-space exit: where the NEXT segment's entrance lands, and its direction. */
  exit: { position: Vec3Tuple, tangent: Vec3Tuple }

  /** Free GPU resources owned by the segment. Called on eviction. */
  dispose?: () => void
}

export interface StreamSegment {
  input:            StreamSegmentInput
  startT:           number
  endT:             number
  length:           number
  worldExit:        THREE.Vector3
  worldExitTangent: THREE.Vector3
}

export interface SegmentStreamOptions {

  /** Segments kept alive; older ones are evicted + disposed. Default 4. */
  maxActive?: number

  /** World-Y added to path points (camera head height). Default 1.6. */
  lift?: number

  /** CatmullRom tension. Default 0.5. */
  tension?: number
}

export interface SegmentStream extends Disposable {
  curve: THREE.CatmullRomCurve3

  /** Total stitched path length (chord-sum estimate) in world units. */
  total: number

  segments: StreamSegment[]

  /** Count of segments ever appended (for prefetch math). */
  appended: number

  /** World-align a segment onto the path end, add it to the scene, evict old ones. */
  append (input: StreamSegmentInput): StreamSegment

  /** Index (into segments) of the segment containing path distance d. */
  indexAt (distance: number): number
}

function tupleToVec (v: Vec3Tuple): THREE.Vector3 {
  return new THREE.Vector3(v[0], v[1], v[2])
}

function quatFromTangents (from: THREE.Vector3, to: THREE.Vector3): THREE.Quaternion {
  const f = from.clone()
  f.y     = 0
  if (f.lengthSq() < 1e-6)
    f.set(0, 0, 1)
  f.normalize()

  const t = to.clone()
  t.y     = 0
  if (t.lengthSq() < 1e-6)
    t.set(0, 0, 1)
  t.normalize()
  return new THREE.Quaternion().setFromUnitVectors(f, t)
}

export function createSegmentStream (
  scene: THREE.Scene,
  { maxActive = 4, lift = 1.6, tension = 0.5 }: SegmentStreamOptions = {},
): SegmentStream {
  const segments: StreamSegment[] = []
  const worldPoints               = new Map<StreamSegment, THREE.Vector3[]>()
  let totalLength = 0
  let appended    = 0

  const stream: SegmentStream = {
    curve: new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, lift, -0.01),
      new THREE.Vector3(0, lift, 0),
    ]),
    get total () {
      return totalLength
    },
    segments,
    get appended () {
      return appended
    },
    append,
    indexAt,
    dispose () {
      for (const seg of segments) {
        scene.remove(seg.input.object)
        seg.input.dispose?.()
      }
      segments.length = 0
      worldPoints.clear()
    },
  }

  function rebuildCurve (): void {
    const pts: THREE.Vector3[] = []
    for (const seg of segments)
      for (const p of worldPoints.get(seg) ?? [])
        if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(p) > 1e-4)
          pts.push(p)
    if (pts.length < 2) {
      pts.push(new THREE.Vector3(0, lift, 0))
      pts.push(new THREE.Vector3(0, lift, 1))
    }
    stream.curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension)
  }

  function append (input: StreamSegmentInput): StreamSegment {
    let worldOffset:   THREE.Vector3
    let worldRotation: THREE.Quaternion

    if (segments.length === 0) {
      worldOffset   = new THREE.Vector3()
      worldRotation = new THREE.Quaternion()
    }
    else {
      const prev = segments[segments.length - 1]
      // Align this segment's local entrance tangent (+z) with prev's exit tangent.
      worldRotation = quatFromTangents(new THREE.Vector3(0, 0, 1), prev.worldExitTangent)
      worldOffset   = prev.worldExit.clone()
    }

    input.object.position.copy(worldOffset)
    input.object.quaternion.copy(worldRotation)

    const toWorld = (lp: Vec3Tuple): THREE.Vector3 =>
      tupleToVec(lp).applyQuaternion(worldRotation)
        .add(worldOffset)

    const lifted = input.pathPoints.map(p => toWorld(p).add(new THREE.Vector3(0, lift, 0)))

    const worldExit        = toWorld(input.exit.position)
    const worldExitTangent = tupleToVec(input.exit.tangent).applyQuaternion(worldRotation)
      .normalize()

    let segLen = 0
    for (let i = 1; i < lifted.length; i++)
      segLen += lifted[i].distanceTo(lifted[i - 1])

    const segment: StreamSegment = {
      input,
      startT: totalLength,
      endT:   totalLength + segLen,
      length: segLen,
      worldExit,
      worldExitTangent,
    }
    totalLength = segment.endT

    segments.push(segment)
    worldPoints.set(segment, lifted)
    scene.add(input.object)
    appended += 1

    while (segments.length > maxActive) {
      const old = segments.shift() as StreamSegment
      worldPoints.delete(old)
      scene.remove(old.input.object)
      old.input.dispose?.()
    }
    rebuildCurve()
    return segment
  }

  function indexAt (distance: number): number {
    for (let i = 0; i < segments.length; i++)
      if (distance <= segments[i].endT)
        return i
    return segments.length - 1
  }

  return stream
}

// perf: append is the only cost (curve rebuild over ≤maxActive segments'
// points). Steady-state per-frame cost is zero — the stream only changes when
// you append. Keep maxActive small; evicted segments must dispose their GPU
// resources via input.dispose.
