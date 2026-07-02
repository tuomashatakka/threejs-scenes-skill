import type { GLTFLoaderOptions } from './gltf.js';
import type { LoadedModel } from '../types.js';
export type ModelLoader = (url: string, options?: GLTFLoaderOptions) => Promise<LoadedModel>;
export declare const FORMAT_LOADERS: Record<string, ModelLoader>;
export interface ModelCache {
    load(src: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
    clear(): void;
}
export declare function createModelCache(): ModelCache;
export declare function loadModel(src: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
export declare function clearModelCache(): void;
//# sourceMappingURL=model-registry.d.ts.map