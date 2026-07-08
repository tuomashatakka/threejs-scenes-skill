// lib/state/index.ts
// threejs-scenes/state — unidirectional data flow as a first-class layer:
// the serializable store, the controller protocol (any { get, subscribe }
// is a valid state source; plain objects are wrapped), and tween/lerp
// transition helpers so state changes animate instead of snapping.
// State flows one way: input writes the store, scaffolds pass state down,
// modules project it onto the scene. Nothing writes back.

export * from '../core/state.js'
export * from './controller.js'
export * from './tween.js'
