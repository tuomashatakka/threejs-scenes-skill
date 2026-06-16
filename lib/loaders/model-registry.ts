// lib/loaders/model-registry.ts
// Format-dispatching model loader + a tiny in-memory cache. loadModel('foo.glb')
// resolves to a LoadedModel regardless of format; extend FORMAT_LOADERS to add
// FBX/OBJ/etc. Used by props/registry.ts to resolve <Prop src="model.glb">.

import { loadGLTF } from './gltf.js'
import type { GLTFLoaderOptions } from './gltf.js'
import type { LoadedModel } from '../types.js'


export type ModelLoader = (url: string, options?: GLTFLoaderOptions) => Promise<LoadedModel>

export const FORMAT_LOADERS: Record<string, ModelLoader> = {
  glb:  loadGLTF,
  gltf: loadGLTF,
}

function extOf (url: string): string {
  const clean = url.split(/[?#]/)[0] ?? url
  return clean.slice(clean.lastIndexOf('.') + 1).toLowerCase()
}

const cache = new Map<string, Promise<LoadedModel>>()

export function loadModel (src: string, options?: GLTFLoaderOptions): Promise<LoadedModel> {
  const ext    = extOf(src)
  const loader = FORMAT_LOADERS[ext]
  if (!loader)
    return Promise.reject(new Error(`loadModel: no loader for ".${ext}" (${src})`))

  const cached = cache.get(src)
  if (cached)
    return cached

  const promise = loader(src, options)
  cache.set(src, promise)
  return promise
}

export function clearModelCache (): void {
  cache.clear()
}

// perf: cache dedupes concurrent + repeat loads of the same URL. Clone the
// returned scene per instance if you need independent transforms.
