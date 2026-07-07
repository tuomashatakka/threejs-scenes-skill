import * as THREE from 'three';
import type { Disposable } from '../types.js';
export interface ConnectionGraphOptions {
    /** Edges per node. Default 3. */
    neighbors?: number;
    /** Skip edges longer than this. Default Infinity. */
    maxDistance?: number;
    color?: THREE.ColorRepresentation;
    highlightColor?: THREE.ColorRepresentation;
    opacity?: number;
}
export interface ConnectionGraph extends Disposable {
    object: THREE.LineSegments;
    /** [nodeIndexA, nodeIndexB] per edge, in attribute order. */
    edges: ReadonlyArray<readonly [number, number]>;
    /** Draw-on animation: 0 = no edges, 1 = all edges visible. */
    setProgress(t: number): void;
    /** Brighten every edge touching this node; null clears. */
    setHighlight(nodeIndex: number | null): void;
}
export declare function createConnectionGraph(nodes: ReadonlyArray<readonly [number, number, number]>, { neighbors, maxDistance, color, highlightColor, opacity, }?: ConnectionGraphOptions): ConnectionGraph;
//# sourceMappingURL=connection-graph.d.ts.map