// lib/post/glitch-passes.ts
// Three discrete glitch ShaderPass factories. Stack them with separate
// intensity uniforms for layered datamosh. Ported from scripts/glitch-passes.js.

import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const FULL_SCREEN_VERTEX = /* glsl */`
  varying vec2 vUv;
  void main () {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const RGB_SHIFT_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uIntensity: { value: 0.5 },
    uAngle:     { value: 0.0 },
  },
  vertexShader:   FULL_SCREEN_VERTEX,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uIntensity, uAngle;
    varying vec2 vUv;
    void main () {
      vec2 off = vec2(cos(uAngle), sin(uAngle)) * (0.005 * uIntensity);
      float r = texture2D(tDiffuse, vUv + off).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - off).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `,
}

const BLOCK_DISPLACEMENT_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uIntensity: { value: 0.5 },
    uBlockSize: { value: 32.0 },
  },
  vertexShader:   FULL_SCREEN_VERTEX,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uIntensity, uBlockSize;
    varying vec2 vUv;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main () {
      vec2 res = vec2(uBlockSize);
      vec2 block = floor(vUv * res) / res;
      float h = hash(block + floor(uTime * 12.0));
      float threshold = 1.0 - uIntensity * 0.4;
      vec2 shift = vec2(0.0);
      if (h > threshold) shift.x = (h - threshold) * 0.3 * sign(h - 0.5);
      vec4 c = texture2D(tDiffuse, vUv + shift);
      if (h > threshold + 0.05) c.rgb = c.bgr;
      gl_FragColor = c;
    }
  `,
}

const SCAN_CORRUPTION_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uTime:      { value: 0 },
    uIntensity: { value: 0.5 },
  },
  vertexShader:   FULL_SCREEN_VERTEX,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime, uIntensity;
    varying vec2 vUv;
    void main () {
      float band = step(0.98, fract(vUv.y * 80.0 + uTime * 2.0));
      float jitter = (band > 0.5) ? (sin(uTime * 30.0 + vUv.y * 100.0) * 0.02 * uIntensity) : 0.0;
      vec4 c = texture2D(tDiffuse, vec2(vUv.x + jitter, vUv.y));
      c.rgb += band * uIntensity * 0.4;
      gl_FragColor = c;
    }
  `,
}

export function createRgbShiftPass (): ShaderPass {
  return new ShaderPass(RGB_SHIFT_SHADER)
}

export function createBlockDisplacementPass (): ShaderPass {
  return new ShaderPass(BLOCK_DISPLACEMENT_SHADER)
}

export function createScanCorruptionPass (): ShaderPass {
  return new ShaderPass(SCAN_CORRUPTION_SHADER)
}

// perf: medium. Each pass is one fullscreen fragment shader. Disable on mobile
// or gate behind a "stylized" quality flag.
