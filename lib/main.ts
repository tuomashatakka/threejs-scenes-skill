// lib/main.ts
// threejs-scenes/main — the curated surface. Six domain namespaces plus the
// symbols almost every scene touches, instead of the ~200-export flat barrel
// at the package root. New code should import from here (or the domain
// subpaths directly); the root barrel remains for back-compat.

export * as primitives from './primitives/index.js'
export * as raster from './raster/index.js'
export * as compose from './compose/index.js'
export * as view from './view/index.js'
export * as state from './state/index.js'
export * as scaffold from './scaffold/index.js'

// the everyday twenty
export { createApp } from './core/app.js'
export { bootstrapScene } from './core/scene-bootstrap.js'
export { createRenderer } from './core/renderer.js'
export { createFrameLoop } from './core/frame-loop.js'
export { createClock } from './core/clock.js'
export { createStore } from './core/state.js'
export { disposeScene } from './core/dispose.js'
export { attachPointerGesture } from './core/pointer-gesture.js'
export { createSeededRng } from './procedural/rng.js'
export { createStandardMaterial } from './materials/presets.js'
export { createExtrudedMesh } from './geometry/extrude.js'
export { createInstancedField } from './instancing/instanced-field.js'
export { setupStandardLighting } from './lighting/lighting.js'
export { createEmitter } from './particles/emitter.js'
export { createComposer } from './post/composer.js'
export { createPostPipeline } from './post/pipeline.js'
export { createIsoCamera } from './camera/iso-camera.js'
export { createFollowCamera } from './camera/follow-camera.js'
export { createCameraController } from './camera/camera-controller.js'
export { defineProp, createProp } from './props/prop.js'
export { pick, pickTopLevel } from './architecture/pick.js'
export { loadGLTF } from './loaders/gltf.js'

export type { App, AppModule, AppOptions } from './core/app.js'
export type { SceneContext, FrameContext, FrameLoop, Disposable, SeededRng } from './types.js'
