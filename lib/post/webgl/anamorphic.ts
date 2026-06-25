// lib/post/webgl/anamorphic.ts
// Anamorphic flare — horizontal blue-tinted light streaks from bright pixels,
// the classic cinematic lens look. WebGL ShaderPass equivalent of the WebGPU
// `webgpu/anamorphic.ts` (AnamorphicNode). Same knobs: threshold, scale,
// samples. The streak is added on top of the scene.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const ANAMORPHIC_SHADER = {
  uniforms: {
    tDiffuse:    { value: null },
    uThreshold:  { value: 0.9 },
    uScale:      { value: 3 },
    uSamples:    { value: 32 },
    uTint:       { value: new THREE.Color(0.3, 0.5, 1.0) },
    uResolution: { value: new THREE.Vector2(1, 1) },
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
    uniform float uThreshold, uScale;
    uniform int uSamples;
    uniform vec3 uTint;
    uniform vec2 uResolution;
    varying vec2 vUv;
    float luma (vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
    void main () {
      vec4 base = texture2D(tDiffuse, vUv);
      float texel = 1.0 / uResolution.x;
      vec3 streak = vec3(0.0);
      float total = 0.0;
      // Sample symmetrically left/right; keep only luminance above threshold.
      for (int i = -64; i <= 64; i++) {
        if (i < -uSamples || i > uSamples) continue;
        float fi = float(i);
        float w = 1.0 - abs(fi) / float(uSamples);
        vec2 off = vec2(fi * texel * uScale, 0.0);
        vec3 s = texture2D(tDiffuse, vUv + off).rgb;
        s = max(s - uThreshold, 0.0);
        streak += s * w;
        total += w;
      }
      streak = streak / max(total, 1e-4) * uTint;
      gl_FragColor = vec4(base.rgb + streak, base.a);
    }
  `,
}

export interface AnamorphicOptions {
  // Luminance cutoff above which pixels streak.
  threshold?: number
  // Horizontal spread of the streak.
  scale?:     number
  // Samples per side (kept under 64).
  samples?:   number
  // Streak tint (default cool blue).
  tint?:      THREE.Color
}

export interface AnamorphicPass extends ShaderPass {
  setSize (width: number, height: number): void
}

export function createAnamorphic (options: AnamorphicOptions = {}): AnamorphicPass {
  const { threshold = 0.9, scale = 3, samples = 32, tint = new THREE.Color(0.3, 0.5, 1.0) } = options
  const pass                                                                                = new ShaderPass(ANAMORPHIC_SHADER) as AnamorphicPass
  pass.uniforms.uThreshold.value                                                            = threshold
  pass.uniforms.uScale.value                                                                = scale
  pass.uniforms.uSamples.value                                                              = Math.min(samples, 64);
  (pass.uniforms.uTint.value as THREE.Color).copy(tint)
  pass.setSize = (width, height) => {
    (pass.uniforms.uResolution.value as THREE.Vector2).set(width, height)
  }
  return pass
}

// perf: medium. up to (2*samples+1) horizontal taps per fragment.
