import * as THREE from 'three';
export interface TransportFrames {
    tangents: THREE.Vector3[];
    normals: THREE.Vector3[];
    binormals: THREE.Vector3[];
}
/** Twist-free coordinate frames along a polyline (parallel transport). */
export declare function parallelTransportFrames(points: THREE.Vector3[]): TransportFrames;
export interface PathTubeOptions {
    /** Constant radius, or a per-point function of (t in [0,1], index). Default 1. */
    radius?: number | ((t: number, index: number) => number);
    /** Cross-section resolution. Default 12. */
    radialSegments?: number;
    /** Flip normals/winding to view the tube from inside (tunnels). Default false. */
    inward?: boolean;
    /** V coordinate repeat along the length. Default 1. */
    vRepeat?: number;
}
/** Sweep a circle through parallel-transport frames along `points`. */
export declare function createPathTube(points: THREE.Vector3[], { radius, radialSegments, inward, vRepeat }?: PathTubeOptions): THREE.BufferGeometry;
//# sourceMappingURL=path-tube.d.ts.map