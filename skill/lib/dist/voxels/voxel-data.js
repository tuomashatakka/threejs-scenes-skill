// lib/voxels/voxel-data.ts
// VoxelChunk — flat Uint16Array storage with bounds-checked accessors.
// Ported from scripts/voxel-data.js.
export class VoxelChunk {
    size;
    data;
    constructor(size) {
        this.size = size;
        this.data = new Uint16Array(size * size * size);
    }
    _idx(x, y, z) {
        return (y * this.size + z) * this.size + x;
    }
    get(x, y, z) {
        if (x < 0 || y < 0 || z < 0 || x >= this.size || y >= this.size || z >= this.size)
            return 0;
        return this.data[this._idx(x, y, z)];
    }
    set(x, y, z, id) {
        if (x < 0 || y < 0 || z < 0 || x >= this.size || y >= this.size || z >= this.size)
            return;
        this.data[this._idx(x, y, z)] = id;
    }
    fill(id) {
        this.data.fill(id);
    }
    forEach(cb) {
        for (let y = 0; y < this.size; y++)
            for (let z = 0; z < this.size; z++)
                for (let x = 0; x < this.size; x++) {
                    const v = this.data[this._idx(x, y, z)];
                    if (v !== 0)
                        cb(x, y, z, v);
                }
    }
}
// perf: cheap. flat typed array, no per-voxel object allocation.
// Memory: 2 bytes per voxel. 32³ = 64 KB.
//# sourceMappingURL=voxel-data.js.map