// lib/state/index.ts
// threejs-scenes/state — unidirectional data flow as a first-class layer:
// the controller protocol (any { get, subscribe } is a valid state source;
// plain objects are wrapped) and tween/lerp transition helpers so state
// changes animate instead of snapping. The serializable store itself lives
// in threejs-scenes/core. State flows one way: input writes the store,
// scaffolds pass state down, modules project it onto the scene.

export * from './controller.js'
export * from './tween.js'
