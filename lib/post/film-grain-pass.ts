// lib/post/film-grain-pass.ts
// Procedural per-fragment grain. Toggle between color grain and luminance grain
// via uLuma uniform. Optional desaturation for a retro film look. Ported from
// scripts/film-grain-pass.js.

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const FILM_GRAIN_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uIntensity: { value: 0.08 },
    uLuma:      { value: 0.5 },
    uDesat:     { value: 0.0 },
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
    uniform float uTime, uIntensity, uLuma, uDesat;
    varying vec2 vUv;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main () {
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb;
      float g = hash(vUv * 1024.0 + uTime);
      vec3 grain = mix(
        vec3(g, hash(vUv * 1024.0 + uTime + 1.0), hash(vUv * 1024.0 + uTime + 2.0)),
        vec3(g),
        uLuma
      );
      col += (grain - 0.5) * uIntensity;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(luma), uDesat);
      gl_FragColor = vec4(col, c.a);
    }
  `,
}

export interface FilmGrainOptions {
  intensity?: number
  luma?:      number
  desat?:     number
}

export function createFilmGrainPass ({
  intensity = 0.08,
  luma = 0.5,
  desat = 0,
}: FilmGrainOptions = {}): ShaderPass {
  const pass                     = new ShaderPass(FILM_GRAIN_SHADER)
  pass.uniforms.uIntensity.value = intensity
  pass.uniforms.uLuma.value      = luma
  pass.uniforms.uDesat.value     = desat
  return pass
}

// perf: cheap. Three hash() calls per fragment. Safe on mobile.
