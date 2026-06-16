export type VoxelVisitor = (x: number, y: number, z: number, id: number) => void;
export declare class VoxelChunk {
    readonly size: number;
    readonly data: Uint16Array;
    constructor(size: number);
    private _idx;
    get(x: number, y: number, z: number): number;
    set(x: number, y: number, z: number, id: number): void;
    fill(id: number): void;
    forEach(cb: VoxelVisitor): void;
}
//# sourceMappingURL=voxel-data.d.ts.map