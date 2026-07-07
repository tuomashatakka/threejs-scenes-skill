import * as THREE from 'three';
import type { Disposable } from '../types.js';
export interface InfiniteGroundOptions {
    tileSize?: number;
    /** Tiles extend gridRadius cells in every direction: (2r+1)² tiles total. */
    gridRadius?: number;
    segments?: number;
    /** World-space height function. Keep it pure — it re-runs on recenter. */
    displace?: (x: number, z: number) => number;
    material?: THREE.Material;
}
export interface InfiniteGround extends Disposable {
    object: THREE.Group;
    /** Recenter tiles around a world position; call with the camera/player pos. */
    update(center: THREE.Vector3): void;
    /** Sample the ground height at a world position. */
    heightAt(x: number, z: number): number;
}
export declare function createInfiniteGround({ tileSize, gridRadius, segments, displace, material, }?: InfiniteGroundOptions): InfiniteGround;
//# sourceMappingURL=infinite-ground.d.ts.map