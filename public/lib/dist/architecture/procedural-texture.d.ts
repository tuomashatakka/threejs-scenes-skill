import * as THREE from 'three';
import type { Disposable } from '../types.js';
export type PaintFn = (ctx: CanvasRenderingContext2D, size: number) => void;
export declare function createProceduralTexture(key: string, paint: PaintFn, size?: number): THREE.CanvasTexture | null;
export declare const proceduralTextureCache: Disposable;
//# sourceMappingURL=procedural-texture.d.ts.map