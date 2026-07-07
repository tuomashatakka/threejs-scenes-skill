import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import type { LoadedModel } from '../types.js';
export interface GLTFLoaderOptions {
    /** DRACO decoder path (CDN or local). Enables compressed-mesh support. */
    draco?: boolean | string;
    /** KTX2 transcoder path; requires a renderer to detect GPU texture support. */
    ktx2?: string;
    renderer?: THREE.WebGLRenderer;
    /** Enable EXT_meshopt_compression decoding. */
    meshopt?: boolean;
}
export declare function createGLTFLoader(options?: GLTFLoaderOptions): GLTFLoader;
export declare function loadGLTF(url: string, options?: GLTFLoaderOptions): Promise<LoadedModel>;
//# sourceMappingURL=gltf.d.ts.map