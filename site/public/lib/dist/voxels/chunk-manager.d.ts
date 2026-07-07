import * as THREE from 'three';
export type ChunkBuilder = (cx: number, cz: number, chunk: THREE.Group) => void | Promise<void>;
export interface ChunkManagerOptions {
    chunkSize: number;
    viewRadius: number;
    rebaseThreshold?: number;
    build: ChunkBuilder;
}
export interface ChunkManager {
    root: THREE.Group;
    update(cameraWorldPos: THREE.Vector3): Promise<void>;
    dispose(): void;
    readonly loadedCount: number;
    readonly pooledCount: number;
}
export declare function createChunkManager({ chunkSize, viewRadius, rebaseThreshold, build, }: ChunkManagerOptions): ChunkManager;
//# sourceMappingURL=chunk-manager.d.ts.map