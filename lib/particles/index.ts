// lib/particles/index.ts
// Particle systems: createEmitter (CPU sim, shapes + curves + bursts),
// createGpuEmitter (GPGPU steady-state field for >50k), curve baking, and the
// deprecated v1 createParticleEmitter.

export * from './curves.js'
export * from './emitter.js'
export * from './gpu-emitter.js'
export * from './cpu-particles.js'
