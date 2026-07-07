import * as THREE from 'three';
import type { Vec3Tuple } from '../camera/targets.js';
import type { Disposable } from '../types.js';
export interface StreamSegmentInput {
    /** Segment content, authored in local space with the entrance at the origin facing +z. */
    object: THREE.Object3D;
    /** Local-space path control points the camera should travel through. */
    pathPoints: Vec3Tuple[];
    /** Local-space exit: where the NEXT segment's entrance lands, and its direction. */
    exit: {
        position: Vec3Tuple;
        tangent: Vec3Tuple;
    };
    /** Free GPU resources owned by the segment. Called on eviction. */
    dispose?: () => void;
}
export interface StreamSegment {
    input: StreamSegmentInput;
    startT: number;
    endT: number;
    length: number;
    worldExit: THREE.Vector3;
    worldExitTangent: THREE.Vector3;
}
export interface SegmentStreamOptions {
    /** Segments kept alive; older ones are evicted + disposed. Default 4. */
    maxActive?: number;
    /** World-Y added to path points (camera head height). Default 1.6. */
    lift?: number;
    /** CatmullRom tension. Default 0.5. */
    tension?: number;
}
export interface SegmentStream extends Disposable {
    curve: THREE.CatmullRomCurve3;
    /** Total stitched path length (chord-sum estimate) in world units. */
    total: number;
    segments: StreamSegment[];
    /** Count of segments ever appended (for prefetch math). */
    appended: number;
    /** World-align a segment onto the path end, add it to the scene, evict old ones. */
    append(input: StreamSegmentInput): StreamSegment;
    /** Index (into segments) of the segment containing path distance d. */
    indexAt(distance: number): number;
}
export declare function createSegmentStream(scene: THREE.Scene, { maxActive, lift, tension }?: SegmentStreamOptions): SegmentStream;
//# sourceMappingURL=segment-stream.d.ts.map