// lib/scaffold/index.ts
// threejs-scenes/scaffold — genre-level wiring in one call. Every scaffold
// accepts a plain object, a store, or a { get, subscribe } controller as its
// state source, wraps the shared createApp runtime, and returns the app plus
// its genre-specific handles. Subpaths also resolve individually:
// 'threejs-scenes/scaffold/iso', '/orbit', '/tpp', '/rails', '/fps'.
export * from '../core/app.js';
export * from './iso.js';
export * from './orbit.js';
export * from './tpp.js';
export * from './rails.js';
export * from './fps.js';
//# sourceMappingURL=index.js.map