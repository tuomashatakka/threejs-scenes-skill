export type Point2 = [number, number];
export interface PoissonDiskOptions {
    width: number;
    height: number;
    minDist: number;
    rng: () => number;
    k?: number;
}
export declare function poissonDisk({ width, height, minDist, rng, k, }: PoissonDiskOptions): Point2[];
//# sourceMappingURL=poisson-disk.d.ts.map