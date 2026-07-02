// lib/particles/gpu-emitter.ts
// GPGPU particle emitter for >50k particles: position/velocity live in float
// render targets updated by GPUComputationRenderer, rendered as THREE.Points.
// A steady-state field — every slot cycles forever through its baked spawn
// attributes (no rate/burst; use createEmitter for choreographed emission).
// Deterministic: spawn textures are baked once from the seed, and respawn
// wraps age by the remainder, so cadence never shifts the pattern.
import * as THREE from 'three';
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js';
import { mulberry32 } from '../procedural/rng.js';
import { bakeCurveTexture } from './curves.js';
import { createEmitter, sampleShape } from './emitter.js';
const POSITION_SHADER = /* glsl */ `
  uniform float uDelta;
  uniform sampler2D uSpawn;      // xyz spawn position, w lifetime
  void main () {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos   = texture2D(texturePosition, uv);   // xyz position, w age
    vec4 vel   = texture2D(textureVelocity, uv);
    vec4 spawn = texture2D(uSpawn, uv);
    float age = pos.w + uDelta;
    if (age >= spawn.w)
      gl_FragColor = vec4(spawn.xyz, age - spawn.w);   // wrap the remainder
    else
      gl_FragColor = vec4(pos.xyz + vel.xyz * uDelta, age);
  }
`;
const VELOCITY_SHADER = /* glsl */ `
  uniform float uDelta;
  uniform vec3 uGravity;
  uniform float uDamping;
  uniform sampler2D uSpawn;      // w lifetime
  uniform sampler2D uSpawnVel;   // xyz initial velocity
  void main () {
    vec2 uv = gl_FragCoord.xy / resolution.xy;
    vec4 pos = texture2D(texturePosition, uv);
    vec4 vel = texture2D(textureVelocity, uv);
    float life = texture2D(uSpawn, uv).w;
    if (pos.w + uDelta >= life)
      gl_FragColor = vec4(texture2D(uSpawnVel, uv).xyz, 0.0);
    else
      gl_FragColor = vec4((vel.xyz + uGravity * uDelta) * uDamping, 0.0);
  }
`;
export function createGpuEmitter(renderer, options) {
    const { capacity, lifetime = [1, 2], shape = { kind: 'point' }, speed = [0.5, 1.5], gravity = [0, -1.5, 0], damping = 1, size = 0.15, sizeCurve = [[0, 0.4], [0.2, 1], [1, 0.6]], color = [[0, '#ffffff'], [1, '#ffffff']], alphaCurve = [[0, 0], [0.1, 1], [0.7, 1], [1, 0]], texture = null, blending = 'additive', seed = 1, } = options;
    const side = Math.ceil(Math.sqrt(capacity));
    const count = side * side;
    const compute = new GPUComputationRenderer(side, side, renderer);
    const positionTex = compute.createTexture();
    const velocityTex = compute.createTexture();
    const spawnData = new Float32Array(count * 4);
    const spawnVelData = new Float32Array(count * 4);
    // bake deterministic spawn attributes; pre-age so the field starts full.
    const rng = mulberry32(seed >>> 0);
    const sample = { px: 0, py: 0, pz: 0, dx: 0, dy: 1, dz: 0 };
    const posData = positionTex.image.data;
    const velData = velocityTex.image.data;
    for (let i = 0; i < count; i++) {
        sampleShape(shape, rng, sample);
        const v = speed[0] + rng() * (speed[1] - speed[0]);
        const life = lifetime[0] + rng() * (lifetime[1] - lifetime[0]);
        const ix = i * 4;
        spawnData[ix + 0] = sample.px;
        spawnData[ix + 1] = sample.py;
        spawnData[ix + 2] = sample.pz;
        spawnData[ix + 3] = life;
        spawnVelData[ix + 0] = sample.dx * v;
        spawnVelData[ix + 1] = sample.dy * v;
        spawnVelData[ix + 2] = sample.dz * v;
        posData[ix + 0] = sample.px;
        posData[ix + 1] = sample.py;
        posData[ix + 2] = sample.pz;
        posData[ix + 3] = rng() * life;
        velData[ix + 0] = spawnVelData[ix + 0];
        velData[ix + 1] = spawnVelData[ix + 1];
        velData[ix + 2] = spawnVelData[ix + 2];
        velData[ix + 3] = 0;
    }
    const spawnTex = new THREE.DataTexture(spawnData, side, side, THREE.RGBAFormat, THREE.FloatType);
    const spawnVelTex = new THREE.DataTexture(spawnVelData, side, side, THREE.RGBAFormat, THREE.FloatType);
    spawnTex.needsUpdate = true;
    spawnVelTex.needsUpdate = true;
    const positionVar = compute.addVariable('texturePosition', POSITION_SHADER, positionTex);
    const velocityVar = compute.addVariable('textureVelocity', VELOCITY_SHADER, velocityTex);
    compute.setVariableDependencies(positionVar, [positionVar, velocityVar]);
    compute.setVariableDependencies(velocityVar, [positionVar, velocityVar]);
    positionVar.material.uniforms.uDelta = { value: 0 };
    positionVar.material.uniforms.uSpawn = { value: spawnTex };
    velocityVar.material.uniforms.uDelta = { value: 0 };
    velocityVar.material.uniforms.uGravity = { value: new THREE.Vector3(...gravity) };
    velocityVar.material.uniforms.uDamping = { value: damping };
    velocityVar.material.uniforms.uSpawn = { value: spawnTex };
    velocityVar.material.uniforms.uSpawnVel = { value: spawnVelTex };
    const initError = compute.init();
    if (initError !== null) {
        // float render targets unavailable — degrade to the CPU emitter.
        console.warn(`createGpuEmitter: ${initError}; falling back to createEmitter`);
        spawnTex.dispose();
        spawnVelTex.dispose();
        return createEmitter(options);
    }
    // render geometry: one point per slot, addressed by its compute-texture uv.
    const geometry = new THREE.BufferGeometry();
    const refs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
        refs[i * 2 + 0] = (i % side + 0.5) / side;
        refs[i * 2 + 1] = (Math.floor(i / side) + 0.5) / side;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute('aRef', new THREE.BufferAttribute(refs, 2));
    const curves = bakeCurveTexture(color, alphaCurve, sizeCurve);
    const material = new THREE.ShaderMaterial({
        uniforms: {
            texturePosition: { value: null },
            uSpawn: { value: spawnTex },
            uCurves: { value: curves },
            uBaseSize: { value: size },
            uPixelScale: { value: 300 },
            uMap: { value: texture },
            uHasMap: { value: texture ? 1 : 0 },
        },
        vertexShader: /* glsl */ `
      attribute vec2 aRef;
      uniform sampler2D texturePosition;
      uniform sampler2D uSpawn;
      uniform sampler2D uCurves;
      uniform float uBaseSize;
      uniform float uPixelScale;
      varying vec4 vColor;
      void main () {
        vec4 pos = texture2D(texturePosition, aRef);
        float life = texture2D(uSpawn, aRef).w;
        float t = clamp(pos.w / life, 0.0, 1.0);
        vColor = texture2D(uCurves, vec2(t, 0.25));
        float size = texture2D(uCurves, vec2(t, 0.75)).r * uBaseSize;
        vec4 mv = modelViewMatrix * vec4(pos.xyz, 1.0);
        gl_PointSize = size * uPixelScale / -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
        fragmentShader: /* glsl */ `
      uniform sampler2D uMap;
      uniform float uHasMap;
      varying vec4 vColor;
      void main () {
        vec4 tex = vec4(1.0);
        if (uHasMap > 0.5) {
          tex = texture2D(uMap, gl_PointCoord);
        }
        else {
          float d = length(gl_PointCoord - 0.5) * 2.0;
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
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    function tick({ delta }) {
        positionVar.material.uniforms.uDelta.value = delta;
        velocityVar.material.uniforms.uDelta.value = delta;
        material.uniforms.uPixelScale.value = renderer.domElement.height;
        compute.compute();
        material.uniforms.texturePosition.value = compute.getCurrentRenderTarget(positionVar).texture;
    }
    return {
        object: points,
        tick,
        burst() { },
        setRate() { },
        dispose() {
            compute.dispose();
            geometry.dispose();
            material.dispose();
            curves.dispose();
            spawnTex.dispose();
            spawnVelTex.dispose();
        },
    };
}
// perf: heavy setup, cheap steady state. Sim cost is 2 fullscreen passes over a
// side×side float target; 100k particles ≈ a 317² texture. CPU cost per tick: zero.
//# sourceMappingURL=gpu-emitter.js.map