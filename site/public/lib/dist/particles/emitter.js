// lib/particles/emitter.ts
// Particle emitter v2: CPU-simulated, GPU-billboarded instanced quads with
// emitter shapes, rate + burst emission, and over-lifetime curves baked to a
// LUT texture. Deterministic by construction: every spawn's randomness comes
// from a hash of (seed, slot, cycle) — never from a shared stream consumed in
// tick order — so the same seed + the same tick sequence reproduce the exact
// same particles (fixes the cadence-dependent respawn of cpu-particles.ts).
import * as THREE from 'three';
import { mulberry32 } from '../procedural/rng.js';
import { bakeCurveTexture } from './curves.js';
// order-independent per-spawn stream: same (seed, slot, cycle) -> same values.
function spawnRng(seed, slot, cycle) {
    return mulberry32((seed ^ Math.imul(slot + 1, 2654435761) ^ Math.imul(cycle + 1, 40503)) >>> 0);
}
/** Sample a spawn position + emission direction from an emitter shape. */
export function sampleShape(shape, r, out) {
    out.px = 0;
    out.py = 0;
    out.pz = 0;
    out.dx = 0;
    out.dy = 1;
    out.dz = 0;
    if (shape.kind === 'point' || shape.kind === 'sphere' || shape.kind === 'box') {
        // uniform direction on the unit sphere
        const u = r() * 2 - 1;
        const a = r() * Math.PI * 2;
        const s = Math.sqrt(1 - u * u);
        out.dx = s * Math.cos(a);
        out.dy = u;
        out.dz = s * Math.sin(a);
        if (shape.kind === 'sphere') {
            const rad = shape.shell ? shape.radius : shape.radius * Math.cbrt(r());
            out.px = out.dx * rad;
            out.py = out.dy * rad;
            out.pz = out.dz * rad;
        }
        else if (shape.kind === 'box') {
            out.px = (r() - 0.5) * shape.size[0];
            out.py = (r() - 0.5) * shape.size[1];
            out.pz = (r() - 0.5) * shape.size[2];
        }
    }
    else {
        // cone / disc: position on a disc, direction up (cone tilts within angle)
        const discRadius = shape.kind === 'cone' ? shape.radius ?? 0 : shape.radius;
        const a = r() * Math.PI * 2;
        const rad = discRadius * Math.sqrt(r());
        out.px = Math.cos(a) * rad;
        out.pz = Math.sin(a) * rad;
        if (shape.kind === 'cone') {
            const tilt = r() * shape.angle;
            const around = r() * Math.PI * 2;
            const st = Math.sin(tilt);
            out.dx = st * Math.cos(around);
            out.dy = Math.cos(tilt);
            out.dz = st * Math.sin(around);
        }
    }
}
const spawnScratch = { px: 0, py: 0, pz: 0, dx: 0, dy: 1, dz: 0 };
export function createEmitter({ capacity, rate, bursts = [], lifetime = [1, 2], shape = { kind: 'point' }, speed = [0.5, 1.5], gravity = [0, -1.5, 0], damping = 1, size = 0.15, sizeCurve = [[0, 0.4], [0.2, 1], [1, 0.6]], color = [[0, '#ffffff'], [1, '#ffffff']], alphaCurve = [[0, 0], [0.1, 1], [0.7, 1], [1, 0]], rotation = [0, 0], texture = null, blending = 'additive', seed = 1, }) {
    const meanLife = (lifetime[0] + lifetime[1]) / 2;
    let ratePerSecond = rate ?? capacity / meanLife;
    const quad = new THREE.PlaneGeometry(1, 1);
    const instanced = new THREE.InstancedBufferGeometry();
    instanced.setAttribute('position', quad.getAttribute('position'));
    instanced.setAttribute('uv', quad.getAttribute('uv'));
    instanced.setIndex(quad.getIndex());
    instanced.instanceCount = capacity;
    const positions = new Float32Array(capacity * 3);
    const velocities = new Float32Array(capacity * 3);
    const ages = new Float32Array(capacity);
    const lifetimes = new Float32Array(capacity); // 0 = dead slot
    const rotSpeeds = new Float32Array(capacity);
    const cycles = new Uint32Array(capacity);
    const freeSlots = [];
    for (let i = capacity - 1; i >= 0; i--)
        freeSlots.push(i);
    const aPos = new THREE.InstancedBufferAttribute(positions, 3);
    const aAge = new THREE.InstancedBufferAttribute(ages, 1);
    const aLife = new THREE.InstancedBufferAttribute(lifetimes, 1);
    const aRot = new THREE.InstancedBufferAttribute(rotSpeeds, 1);
    instanced.setAttribute('aPos', aPos);
    instanced.setAttribute('aAge', aAge);
    instanced.setAttribute('aLife', aLife);
    instanced.setAttribute('aRot', aRot);
    const curves = bakeCurveTexture(color, alphaCurve, sizeCurve);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            uMap: { value: texture },
            uHasMap: { value: texture ? 1 : 0 },
            uCurves: { value: curves },
            uBaseSize: { value: size },
        },
        vertexShader: /* glsl */ `
      attribute vec3 aPos;
      attribute float aAge;
      attribute float aLife;
      attribute float aRot;
      uniform sampler2D uCurves;
      uniform float uBaseSize;
      varying vec2 vUv;
      varying vec4 vColor;
      void main () {
        float t = aLife > 0.0 ? clamp(aAge / aLife, 0.0, 1.0) : 1.0;
        vColor = texture2D(uCurves, vec2(t, 0.25));
        float size = texture2D(uCurves, vec2(t, 0.75)).r * uBaseSize;
        if (aLife <= 0.0 || aAge >= aLife) size = 0.0;
        float angle = aRot * aAge;
        float c = cos(angle);
        float s = sin(angle);
        vec2 corner = mat2(c, -s, s, c) * position.xy * size;
        vec4 viewCenter = modelViewMatrix * vec4(aPos, 1.0);
        viewCenter.xy += corner;
        gl_Position = projectionMatrix * viewCenter;
        vUv = uv;
      }
    `,
        fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uHasMap;
      varying vec2 vUv;
      varying vec4 vColor;
      void main () {
        vec4 tex = vec4(1.0);
        if (uHasMap > 0.5) {
          tex = texture2D(uMap, vUv);
        }
        else {
          float d = length(vUv - 0.5) * 2.0;
          tex.a = smoothstep(1.0, 0.2, d);
        }
        vec4 c = tex * vColor;
        if (c.a < 0.01) discard;
        gl_FragColor = c;
      }
    `,
        transparent: true,
        depthWrite: false,
        blending: blending === 'additive' ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    const mesh = new THREE.Mesh(instanced, material);
    mesh.frustumCulled = false;
    function spawn(slot) {
        const r = spawnRng(seed, slot, cycles[slot]);
        cycles[slot] = cycles[slot] + 1;
        const ix = slot * 3;
        sampleShape(shape, r, spawnScratch);
        const v = speed[0] + r() * (speed[1] - speed[0]);
        positions[ix + 0] = spawnScratch.px;
        positions[ix + 1] = spawnScratch.py;
        positions[ix + 2] = spawnScratch.pz;
        velocities[ix + 0] = spawnScratch.dx * v;
        velocities[ix + 1] = spawnScratch.dy * v;
        velocities[ix + 2] = spawnScratch.dz * v;
        ages[slot] = 0;
        lifetimes[slot] = lifetime[0] + r() * (lifetime[1] - lifetime[0]);
        rotSpeeds[slot] = rotation[0] + r() * (rotation[1] - rotation[0]);
    }
    function spawnMany(count) {
        while (count > 0 && freeSlots.length > 0) {
            spawn(freeSlots.pop());
            count -= 1;
        }
    }
    let simTime = 0;
    let pending = 0;
    let burstIndex = 0;
    const burstQueue = [...bursts].sort((a, b) => a.time - b.time);
    function tick({ delta }) {
        simTime += delta;
        // integrate + collect deaths (in slot order -> deterministic free list)
        for (let i = 0; i < capacity; i++) {
            const life = lifetimes[i];
            if (life <= 0)
                continue;
            const ix = i * 3;
            velocities[ix + 0] = (velocities[ix + 0] + gravity[0] * delta) * damping;
            velocities[ix + 1] = (velocities[ix + 1] + gravity[1] * delta) * damping;
            velocities[ix + 2] = (velocities[ix + 2] + gravity[2] * delta) * damping;
            positions[ix + 0] += velocities[ix + 0] * delta;
            positions[ix + 1] += velocities[ix + 1] * delta;
            positions[ix + 2] += velocities[ix + 2] * delta;
            ages[i] = ages[i] + delta;
            if (ages[i] >= life) {
                lifetimes[i] = 0;
                freeSlots.push(i);
            }
        }
        // scheduled bursts
        while (burstIndex < burstQueue.length && burstQueue[burstIndex].time <= simTime) {
            spawnMany(burstQueue[burstIndex].count);
            burstIndex += 1;
        }
        // continuous emission
        pending += ratePerSecond * delta;
        const n = Math.floor(pending);
        if (n > 0) {
            pending -= n;
            spawnMany(n);
        }
        aPos.needsUpdate = true;
        aAge.needsUpdate = true;
        aLife.needsUpdate = true;
        aRot.needsUpdate = true;
    }
    return {
        object: mesh,
        tick,
        burst: spawnMany,
        setRate(value) {
            ratePerSecond = value;
        },
        dispose() {
            instanced.dispose();
            material.dispose();
            curves.dispose();
            quad.dispose();
        },
    };
}
// perf: medium. CPU integration is O(capacity) per tick; attribute upload
// dominates past ~50k — use createGpuEmitter above that.
//# sourceMappingURL=emitter.js.map