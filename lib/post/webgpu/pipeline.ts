// lib/post/webgpu/pipeline.ts
// Entry points for the WebGPU/TSL post-processing pipeline. Build a scene pass,
// optionally expose normal + viewZ via MRT for geometry-aware effects, then wrap
// it all in a PostProcessing instance whose outputNode is the composed chain.

import * as THREE from 'three'
import { PostProcessing } from 'three/webgpu'
import type { Renderer, Node } from 'three/webgpu'
import {
  pass,
  mrt,
  output,
  normalView,
  velocity,
  emissive,
  metalness,
  roughness,
  directionToColor,
  vec2,
  vec4,
} from 'three/tsl'

import type { ScenePassTargets } from './types.js'

// Basic colour-only scene pass — enough for bloom, dof, ca, fxaa, etc.
export function createScenePass (scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets {
  const scenePass = pass(scene, camera)
  return {
    pass:   scenePass,
    color:  scenePass.getTextureNode('output'),
    viewZ:  scenePass.getViewZNode(),
    normal: normalView,
  }
}

// Scene pass with a multiple-render-target layout exposing a normal buffer.
// Required by geometry-aware effects (ao, ssr, ssgi, sss, traa) so they can read
// per-pixel normals and linear depth instead of re-rendering the scene.
export function createScenePassMRT (scene: THREE.Scene, camera: THREE.Camera): ScenePassTargets {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, normal: normalView }))
  return {
    pass:   scenePass,
    color:  scenePass.getTextureNode('output'),
    viewZ:  scenePass.getViewZNode(),
    normal: scenePass.getTextureNode('normal'),
  }
}

// Scene pass exposing per-pixel screen-space velocity (for motion blur / TRAA).
// Read it back with `scenePass.getTextureNode('velocity')`.
export function createScenePassVelocity (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, velocity }))
  return scenePass
}

// Scene pass exposing the emissive contribution as its own channel, so emissive
// bloom can bloom only the glowing parts. The example narrows the emissive
// attachment to a byte texture to save bandwidth — do that on the returned pass
// if needed (`scenePass.getTexture('emissive').type = THREE.UnsignedByteType`).
export function createScenePassEmissive (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }))
  return scenePass
}

// Scene pass for SSR: encodes view normals to colour and packs metalness +
// roughness into a single attachment. Read normals back with
// `colorToDirection(scenePass.getTextureNode('normal'))` and the packed material
// channels from `.r` / `.g` of the metalrough texture.
export function createScenePassSSR (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({
    output,
    normal:     directionToColor(normalView),
    metalrough: vec2(metalness, roughness),
  }))
  return scenePass
}

// Wrap a composed output node in a PostProcessing instance ready to render.
// perf: one PostProcessing per scene; call dispose on teardown.
export function createPostProcessing (renderer: Renderer, outputNode: Node): PostProcessing {
  const pp      = new PostProcessing(renderer)
  pp.outputNode = outputNode
  return pp
}
