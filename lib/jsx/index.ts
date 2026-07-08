// lib/jsx/index.ts
// Imperative-but-reactive JSX layer over threejs-scenes. Author scenes as
// elements; render() mounts them and drives reactivity from the frame loop.
//   import { render, h, signal } from 'threejs-scenes/jsx'
export * from './jsx-runtime.js'
export * from './signal.js'
export * from './render.js'
export { useRuntime, useScene, useRenderer, useCamera, useLoop, useRng, useSize, useAspect, useFrame, useDispose, useFrameLoop, useSignal, useDerived } from './hooks.js'
export { mountTree } from './reconciler.js'
export type { Runtime, Host, ReactiveBinding } from './components.js'
export type * from './types.js'
