// lib/post/webgl/ca.ts
// Chromatic aberration — splits R/G/B radially from a centre point for a lens
// fringing look. WebGL ShaderPass equivalent of the WebGPU `webgpu/ca.ts`
// (ChromaticAberrationNode). Same knobs: strength, center, scale.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


const CA_SHADER = {
  uniforms: {
    tDiffuse:  { value: null },
    uStrength: { value: 1 },
    uCenter:   { value: new THREE.Vector2(0.5, 0.5) },
    uScale:    { value: 1.2 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uStrength, uScale;
    uniform vec2 uCenter;
    varying vec2 vUv;
    void main () {
      // Offset grows with distance from the centre; channels separate along it.
      vec2 dir = vUv - uCenter;
      vec2 off = dir * uStrength * 0.01;
      float r = texture2D(tDiffuse, vUv + off * uScale).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - off * uScale).b;
      float a = texture2D(tDiffuse, vUv).a;
      gl_FragColor = vec4(r, g, b, a);
    }
  `,
}

export interface ChromaticAberrationOptions {
  // Fringe magnitude.
  strength?: number
  // Centre of the radial split in screen UV (0..1).
  center?:   THREE.Vector2
  // Per-channel scale falloff.
  scale?:    number
}

export function createChromaticAberration (options: ChromaticAberrationOptions = {}): Pass {
  const { strength = 1, center = new THREE.Vector2(0.5, 0.5), scale = 1.2 } = options
  const pass                                                                = new ShaderPass(CA_SHADER)
  pass.uniforms.uStrength.value                                             = strength;
  (pass.uniforms.uCenter.value as THREE.Vector2).copy(center)
  pass.uniforms.uScale.value = scale
  return pass
}

// perf: low. Three texture taps with a radial offset.
