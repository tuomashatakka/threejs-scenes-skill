// lib/loaders/gltf.ts
// GLTF loading wrapper. createGLTFLoader wires the optional DRACO / KTX2 /
// meshopt decoders only when asked; loadGLTF resolves to a normalized
// LoadedModel ({ scene, animations, cameras, asset }). Loaders are reused across
// calls so decoder modules aren't re-fetched.

import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'

import type { LoadedModel } from '../types.js'


export interface GLTFLoaderOptions {

  /** DRACO decoder path (CDN or local). Enables compressed-mesh support. */
  draco?: boolean | string

  /** KTX2 transcoder path; requires a renderer to detect GPU texture support. */
  ktx2?:     string
  renderer?: THREE.WebGLRenderer

  /** Enable EXT_meshopt_compression decoding. */
  meshopt?: boolean
}

const DRACO_CDN = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
const KTX2_CDN  = 'https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/libs/basis/'

let shared: GLTFLoader | null = null

export function createGLTFLoader (options: GLTFLoaderOptions = {}): GLTFLoader {
  const loader = new GLTFLoader()

  if (options.draco) {
    const draco = new DRACOLoader()
    draco.setDecoderPath(typeof options.draco === 'string' ? options.draco : DRACO_CDN)
    loader.setDRACOLoader(draco)
  }
  if (options.ktx2 || options.renderer) {
    const ktx2 = new KTX2Loader().setTranscoderPath(options.ktx2 ?? KTX2_CDN)
    if (options.renderer)
      ktx2.detectSupport(options.renderer)
    loader.setKTX2Loader(ktx2)
  }
  if (options.meshopt)
    loader.setMeshoptDecoder(MeshoptDecoder)

  return loader
}

function getSharedLoader (): GLTFLoader {
  if (!shared)
    shared = new GLTFLoader()
  return shared
}

export function loadGLTF (url: string, options?: GLTFLoaderOptions): Promise<LoadedModel> {
  const loader = options ? createGLTFLoader(options) : getSharedLoader()
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      gltf => resolve({
        scene:      gltf.scene,
        animations: gltf.animations,
        cameras:    gltf.cameras,
        asset:      gltf.asset,
      }),
      undefined,
      reject,
    )
  })
}

// perf: loading is async + off the render thread (decoders may use workers).
// Reuse one loader; dispose returned scene's geometries/materials on teardown.
