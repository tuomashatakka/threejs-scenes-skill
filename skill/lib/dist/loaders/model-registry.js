// lib/loaders/model-registry.ts
// Format-dispatching model loader + a tiny in-memory cache. loadModel('foo.glb')
// resolves to a LoadedModel regardless of format; extend FORMAT_LOADERS to add
// FBX/OBJ/etc. Used by props/registry.ts to resolve <Prop src="model.glb">.
import { loadGLTF } from './gltf.js';
export const FORMAT_LOADERS = {
    glb: loadGLTF,
    gltf: loadGLTF,
};
function extOf(url) {
    const clean = url.split(/[?#]/)[0] ?? url;
    return clean.slice(clean.lastIndexOf('.') + 1).toLowerCase();
}
const cache = new Map();
export function loadModel(src, options) {
    const ext = extOf(src);
    const loader = FORMAT_LOADERS[ext];
    if (!loader)
        return Promise.reject(new Error(`loadModel: no loader for ".${ext}" (${src})`));
    const cached = cache.get(src);
    if (cached)
        return cached;
    const promise = loader(src, options);
    cache.set(src, promise);
    return promise;
}
export function clearModelCache() {
    cache.clear();
}
// perf: cache dedupes concurrent + repeat loads of the same URL. Clone the
// returned scene per instance if you need independent transforms.
//# sourceMappingURL=model-registry.js.map