// lib/post/webgpu/pipeline.ts
// Entry points for the WebGPU/TSL post-processing pipeline. Build a scene pass,
// optionally expose normal + viewZ via MRT for geometry-aware effects, then wrap
// it all in a RenderPipeline instance whose outputNode is the composed chain.
//
// RenderPipeline replaces the deprecated PostProcessing class (PostProcessing was
// renamed to RenderPipeline in r183 and is now only a back-compat wrapper that
// will be removed). The surface is identical: `new RenderPipeline(renderer)`,
// assign `.outputNode`, call `.render()` each frame, set `.needsUpdate = true`
// after swapping the output node. See https://threejs.org/docs/#RenderPipeline.

import * as THREE from 'three'
import { RenderPipeline } from 'three/webgpu'
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


/**
 * Create a basic colour-only scene {@link PassNode} returning colour, viewZ, and normal nodes.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @returns A {@link ScenePassTargets} with `pass` (the PassNode), `color` (scene output texture), `viewZ` (linear depth), and `normal` (view-space normals).
 * @remarks Requires the WebGPU renderer (three/webgpu). Sufficient for colour-input effects: bloom, DOF, chromatic aberration, FXAA.
 */
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


/**
 * Create a scene {@link PassNode} with an MRT layout exposing a view-space normal buffer alongside colour.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @returns A {@link ScenePassTargets} with `pass`, `color`, `viewZ`, and a `normal` node from the MRT normal attachment.
 * @remarks Requires the WebGPU renderer (three/webgpu). Required by geometry-aware effects: AO, SSR, SSGI, SSS, and TRAA.
 */
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


/**
 * Create a scene {@link PassNode} exposing a per-pixel screen-space velocity MRT channel.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @returns A {@link PassNode} with an `output` colour attachment and a `velocity` channel. Read velocity via `scenePass.getTextureNode('velocity')`.
 * @remarks Requires the WebGPU renderer (three/webgpu). Required by motion blur (see {@link createMotionBlur}) and TRAA (see {@link createTraa}).
 */
export function createScenePassVelocity (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, velocity }))
  return scenePass
}

// Scene pass exposing the emissive contribution as its own channel, so emissive
// bloom can bloom only the glowing parts. The example narrows the emissive
// attachment to a byte texture to save bandwidth — do that on the returned pass
// if needed (`scenePass.getTexture('emissive').type = THREE.UnsignedByteType`).


/**
 * Create a scene {@link PassNode} exposing the emissive PBR contribution as its own MRT channel.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @returns A {@link PassNode} with an `output` colour attachment and an `emissive` channel Narrow the emissive attachment to a byte texture via `scenePass.getTexture('emissive').type = THREE.UnsignedByteType` to save bandwidth.
 * @remarks Requires the WebGPU renderer (three/webgpu). Used by emissive-only bloom ({@link createBloomEmissive}).
 */
export function createScenePassEmissive (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }))
  return scenePass
}

// Scene pass for SSR: encodes view normals to colour and packs metalness +
// roughness into a single attachment. Read normals back with
// `colorToDirection(scenePass.getTextureNode('normal'))` and the packed material
// channels from `.r` / `.g` of the metalrough texture.


/**
 * Create a scene {@link PassNode} with an MRT layout encoding view normals to colour and packing metalness with roughness, for screen-space reflections.
 *
 * @param scene - The scene to render.
 * @param camera - The active camera.
 * @returns A {@link PassNode} with `output`, `normal` (decoded via `colorToDirection()`), and `metalrough` (packed metalness.r + roughness.g) attachments.
 * @remarks Requires the WebGPU renderer (three/webgpu). Used by {@link createSsr}.
 */
export function createScenePassSSR (scene: THREE.Scene, camera: THREE.Camera) {
  const scenePass = pass(scene, camera)
  scenePass.setMRT(mrt({
    output,
    normal:     directionToColor(normalView),
    metalrough: vec2(metalness, roughness),
  }))
  return scenePass
}

// Wrap a composed output node in a RenderPipeline instance ready to render.
// Drive it from the animation loop with `pipeline.render()` (replaces
// `renderer.render(scene, camera)`); after reassigning `.outputNode` at runtime,
// set `.needsUpdate = true`. perf: one RenderPipeline per scene; dispose on teardown.


/**
 * Wrap a composed output node in a {@link RenderPipeline} instance ready to render each frame.
 *
 * @param renderer - The WebGPU renderer.
 * @param outputNode - The composed TSL output node (the complete post-processing chain).
 * @returns A {@link RenderPipeline}. Drive it from the animation loop with `pipeline.render()` instead of `renderer.render(scene, camera)`. After runtime reassignment of `.outputNode`, set `.needsUpdate = true`.
 * @remarks Requires the WebGPU renderer (three/webgpu). RenderPipeline replaces the deprecated PostProcessing class (removed in three.js r183). Dispose on teardown.
 */
export function createRenderPipeline (renderer: Renderer, outputNode: Node): RenderPipeline {
  const pipeline      = new RenderPipeline(renderer)
  pipeline.outputNode = outputNode
  return pipeline
}

/**
 * Back-compat alias of `createRenderPipeline`.
 * @deprecated Renamed to {@link createRenderPipeline}. PostProcessing was renamed
 * to RenderPipeline in three.js r183; this alias is kept for back-compat and will
 * be removed alongside three's PostProcessing wrapper.
 */
export const createPostProcessing = createRenderPipeline
