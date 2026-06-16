import type * as THREE from 'three';
import type { Disposable } from '../types.js';
export declare class MaterialPool implements Disposable {
    private readonly cache;
    get<T extends THREE.Material>(key: string, factory: () => T): T;
    has(key: string): boolean;
    get size(): number;
    dispose(): void;
}
//# sourceMappingURL=material-pool.d.ts.map