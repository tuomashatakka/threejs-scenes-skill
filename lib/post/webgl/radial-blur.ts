// lib/post/webgl/radial-blur.ts
// Radial (zoom) blur radiating from a screen-space centre — fakes light shafts
// / "god rays" by smearing brightness outward. WebGL ShaderPass equivalent of
// the WebGPU `radialBlur` TSL node. Same knobs: center, weight, decay, count,
// exposure. Unlike the depth-aware godrays pass this ignores 3D depth (the
// centre is a flat 2D point), so it is not physically correct lighting.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'


const RADIAL_BLUR_SHADER = {
  uniforms: {
    tDiffuse:  { value: null },
    uCenter:   { value: new THREE.Vector2(0.5, 0.5) },
    uWeight:   { value: 0.9 },
    uDecay:    { value: 0.95 },
    uExposure: { value: 5 },
    uCount:    { value: 32 },
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
    uniform vec2 uCenter;
    uniform float uWeight, uDecay, uExposure;
    uniform int uCount;
    varying vec2 vUv;
    void main () {
      // March from the fragment toward the centre, accumulating samples with a
      // decaying weight (same scheme as the radialBlur node / GPU Gems shafts).
      vec2 delta = (vUv - uCenter) / float(uCount);
      vec2 coord = vUv;
      vec3 sum = vec3(0.0);
      float illum = uWeight;
      for (int i = 0; i < 128; i++) {
        if (i >= uCount) break;
        coord -= delta;
        sum += texture2D(tDiffuse, coord).rgb * illum;
        illum *= uDecay;
      }
      sum /= float(uCount);
      sum *= uExposure;
      gl_FragColor = vec4(sum, texture2D(tDiffuse, vUv).a);
    }
  `,
}

export interface RadialBlurOptions {
  center?:   THREE.Vector2
  // Base weight per sample, [0,1].
  weight?:   number
  // Per-iteration weight falloff, [0,1]. Raise it if you raise count to avoid darkening.
  decay?:    number
  // Iteration count, recommended [16,64].
  count?:    number
  // Overall brightness multiplier.
  exposure?: number
}

export function createRadialBlur (options: RadialBlurOptions = {}): Pass {
  const { center = new THREE.Vector2(0.5, 0.5), weight = 0.9, decay = 0.95, count = 32, exposure = 5 } = options
  const pass                                                                                           = new ShaderPass(RADIAL_BLUR_SHADER);
  (pass.uniforms.uCenter.value as THREE.Vector2).copy(center)
  pass.uniforms.uWeight.value   = weight
  pass.uniforms.uDecay.value    = decay
  pass.uniforms.uCount.value    = count
  pass.uniforms.uExposure.value = exposure
  return pass
}

// perf: medium. up to `count` taps per fragment. Lower count for mobile.
