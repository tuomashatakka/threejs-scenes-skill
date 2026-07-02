// lib/particles/cpu-particles.ts
// CPU-driven particle system using InstancedBufferGeometry + GLSL billboarding.
// Suitable for 10k-50k particles with custom physics. Ported from
// scripts/cpu-particles.js. Deterministic phase math, zero per-frame alloc.
import * as THREE from 'three';
import { mulberry32 } from '../procedural/rng.js';
/**
 * @deprecated Use {@link createEmitter} from './emitter.js' — it adds shapes,
 * rate/burst emission, over-lifetime curves, and cadence-independent
 * determinism (this emitter's respawn consumes its RNG in tick order, so the
 * same seed can produce different runs).
 */
export function createParticleEmitter({ count, texture, bounds = 10, seed = 1, gravity = -1.5, damping = 0.96, }) {
    const geometry = new THREE.PlaneGeometry(0.1, 0.1);
    const instanced = new THREE.InstancedBufferGeometry();
    instanced.setAttribute('position', geometry.getAttribute('position'));
    instanced.setAttribute('uv', geometry.getAttribute('uv'));
    instanced.setIndex(geometry.getIndex());
    instanced.instanceCount = count;
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const ages = new Float32Array(count);
    const rng = mulberry32(seed);
    for (let i = 0; i < count; i++) {
        positions[i * 3 + 0] = (rng() - 0.5) * bounds;
        positions[i * 3 + 1] = rng() * bounds;
        positions[i * 3 + 2] = (rng() - 0.5) * bounds;
        velocities[i * 3 + 0] = (rng() - 0.5) * 0.5;
        velocities[i * 3 + 1] = rng() * 0.2;
        velocities[i * 3 + 2] = (rng() - 0.5) * 0.5;
        lifetimes[i] = 2 + rng() * 4;
        ages[i] = rng() * lifetimes[i];
    }
    const aPos = new THREE.InstancedBufferAttribute(positions, 3);
    const aAge = new THREE.InstancedBufferAttribute(ages, 1);
    instanced.setAttribute('aInstancePos', aPos);
    instanced.setAttribute('aAge', aAge);
    const material = new THREE.ShaderMaterial({
        uniforms: { uMap: { value: texture } },
        vertexShader: /* glsl */ `
      attribute vec3 aInstancePos;
      attribute float aAge;
      varying vec2 vUv;
      varying float vAge;
      void main () {
        vec4 viewCenter = modelViewMatrix * vec4(aInstancePos, 1.0);
        viewCenter.xy += position.xy;
        gl_Position = projectionMatrix * viewCenter;
        vUv = uv;
        vAge = aAge;
      }
    `,
        fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      varying vec2 vUv;
      varying float vAge;
      void main () {
        vec4 c = texture2D(uMap, vUv);
        c.a *= max(0.0, 1.0 - vAge);
        if (c.a < 0.01) discard;
        gl_FragColor = c;
      }
    `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    function tick({ delta }) {
        for (let i = 0; i < count; i++) {
            const ix = i * 3;
            velocities[ix + 1] += gravity * delta;
            velocities[ix + 0] *= damping;
            velocities[ix + 1] *= damping;
            velocities[ix + 2] *= damping;
            positions[ix + 0] += velocities[ix + 0] * delta;
            positions[ix + 1] += velocities[ix + 1] * delta;
            positions[ix + 2] += velocities[ix + 2] * delta;
            ages[i] += delta;
            // respawn on death
            if (ages[i] > lifetimes[i] || positions[ix + 1] < -bounds) {
                positions[ix + 0] = (rng() - 0.5) * bounds * 0.2;
                positions[ix + 1] = bounds;
                positions[ix + 2] = (rng() - 0.5) * bounds * 0.2;
                velocities[ix + 0] = (rng() - 0.5) * 0.5;
                velocities[ix + 1] = rng() * 0.2;
                velocities[ix + 2] = (rng() - 0.5) * 0.5;
                ages[i] = 0;
            }
        }
        aPos.needsUpdate = true;
        aAge.needsUpdate = true;
    }
    function dispose() {
        instanced.dispose();
        material.dispose();
    }
    return { mesh, tick, dispose };
}
// perf: medium. CPU update is O(count) per frame; matrix upload dominates past
// ~50k particles. Switch to GPGPU above that.
//# sourceMappingURL=cpu-particles.js.map