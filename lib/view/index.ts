// lib/view/index.ts
// threejs-scenes/view — binding a scene to the actual page: the renderer and
// canvas, the animation-frame loop and injectable clocks, raw pointer-gesture
// input, overlay compositing, screen projection, disposal, and device-tier
// quality detection. Everything DOM- and rAF-adjacent lives here; nothing in
// this layer knows what the scene contains.

export * from '../core/renderer.js'
export * from '../core/frame-loop.js'
export * from '../core/clock.js'
export * from '../core/scene-bootstrap.js'
export * from '../core/pointer-gesture.js'
export * from '../core/overlay.js'
export * from '../core/projection.js'
export * from '../core/dispose.js'
export * from '../core/quality.js'
