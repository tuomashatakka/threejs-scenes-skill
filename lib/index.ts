// lib/index.ts
// @tuomashatakka/threejs-scenes — curated entrypoint.
//
// The root is intentionally small: the shared type vocabulary, a hand-picked
// set of the most-used factories, and the six domain namespaces. The full
// library is grouped by concern behind those namespaces — and each is also a
// tree-shakeable subpath:
//
//   import { createApp, raster, primitives } from '@tuomashatakka/threejs-scenes'
//   const bloom = raster.createBloomPass({ ... })
//
//   // or, for tree-shaking / deep imports:
//   import { createBloomPass } from '@tuomashatakka/threejs-scenes/raster'
//
// Data flows one way:  state → scaffold → compose → primitives, with view and
// raster on the output side. WebGPU/TSL post effects and the reactive JSX layer
// stay off this barrel (they pull in three/webgpu + three/tsl / a runtime):
// import them from '@tuomashatakka/threejs-scenes/webgpu' and '/jsx'.

// --- shared type vocabulary (SceneContext, FrameContext, ParamSpec, tuples...) ---
export * from './types.js'

// --- curated flat "hero" surface: the fast path to a running scene ---
export { createApp } from './core/app.js'
export { bootstrapScene } from './core/scene-bootstrap.js'
export { createRenderer, attachResizeObserver } from './core/renderer.js'
export { createFrameLoop } from './core/frame-loop.js'
export { createClock } from './core/clock.js'
export { disposeScene } from './core/dispose.js'
export { attachPointerGesture } from './core/pointer-gesture.js'
export {
  createIsoScaffold,
  createOrbitScaffold,
  createTppScaffold,
  createRailsScaffold,
  createFpsScaffold,
} from './scaffold/index.js'
export { createIsoCamera, resizeIsoCamera } from './camera/iso-camera.js'
export { createStandardMaterial, createToonMaterial, createMatcapMaterial } from './materials/presets.js'
export { createExtrudedMesh } from './geometry/extrude.js'
export { gearShape, starShape, roundedRectShape } from './geometry/shapes.js'
export { layoutGrid } from './geometry/group.js'
export { applyTwist, applyTaper, displaceByNoise } from './geometry/modifiers.js'
export { createInfiniteGround } from './geometry/infinite-ground.js'
export { setupStandardLighting } from './lighting/lighting.js'
export { createAnimationController } from './animation/mixer.js'
export { spinClip, bobClip, pulseScaleClip, combineClips } from './animation/clips.js'
export { createProp, defineProp } from './props/prop.js'
export { createPropComposite } from './props/composite.js'
export { createInstancedProp } from './props/instanced-prop.js'
export { createEmitter } from './particles/emitter.js'
export { createGpuEmitter } from './particles/gpu-emitter.js'
export { createNoise3D } from './procedural/noise.js'

// --- domain namespaces: the whole library, grouped by concern ---
export * as primitives from './primitives/index.js'
export * as raster from './raster/index.js'
export * as compose from './compose/index.js'
export * as view from './view/index.js'
export * as state from './state/index.js'
export * as scaffold from './scaffold/index.js'
