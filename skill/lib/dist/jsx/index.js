// lib/jsx/index.ts
// Imperative-but-reactive JSX layer over threejs-scenes. Author scenes as
// elements; render() mounts them and drives reactivity from the frame loop.
//   import { render, h, signal } from '@tuomashatakka/threejs-scenes/jsx'
export * from './jsx-runtime.js';
export * from './signal.js';
export * from './render.js';
export { mountTree } from './reconciler.js';
//# sourceMappingURL=index.js.map