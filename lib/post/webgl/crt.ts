// lib/post/webgl/crt.ts
// CRT monitor pass: pincushion curvature + vignette + occasional glitch tear.
// Because curvature warps the image, pointer picking must invert it —
// crtCorrectPointer() applies the same math to a pointer NDC position so
// raycasts hit what the user actually sees. Ported from stellar-cartogrph's
// crt shader + correctPointerForCrt.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'

import type { FrameContext } from '../../types.js'


const CRT_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uCurvature: { value: 0.12 },
    uVignette:  { value: 0.35 },
    uGlitch:    { value: 0.0 },
    uTime:      { value: 0 },
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
    uniform float uCurvature, uVignette, uGlitch, uTime;
    varying vec2 vUv;

    float hash (float n) { return fract(sin(n) * 43758.5453); }

    void main () {
      // pincushion: displace toward the center by r^2
      vec2 centered = vUv * 2.0 - 1.0;
      vec2 warped = centered * (1.0 + uCurvature * dot(centered, centered));
      vec2 uv = warped * 0.5 + 0.5;
      if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
      }
      // glitch: rare horizontal band tear + rgb split
      float band = step(1.0 - uGlitch * 0.02, hash(floor(uv.y * 48.0) + floor(uTime * 7.0)));
      uv.x += band * (hash(uTime) - 0.5) * 0.08;
      vec3 c;
      c.r = texture2D(tDiffuse, uv + band * vec2(0.004, 0.0)).r;
      c.g = texture2D(tDiffuse, uv).g;
      c.b = texture2D(tDiffuse, uv - band * vec2(0.004, 0.0)).b;
      // vignette from the warped radius
      float vig = 1.0 - uVignette * smoothstep(0.4, 1.4, dot(centered, centered));
      gl_FragColor = vec4(c * vig, 1.0);
    }
  `,
}

export interface CrtOptions {

  /** Pincushion strength; 0 disables the warp. */
  curvature?: number

  /** Edge darkening, [0,1]. */
  vignette?: number

  /** Glitch tear probability scale, [0,1]. */
  glitch?: number
}

export interface CrtPass extends ShaderPass {

  /** Advance the glitch clock — call from your frame loop. */
  tick (ctx: FrameContext): void
}

export function createCrtPass ({ curvature = 0.12, vignette = 0.35, glitch = 0.3 }: CrtOptions = {}): CrtPass {
  const pass = new ShaderPass(CRT_SHADER) as CrtPass

  pass.uniforms.uCurvature.value = curvature
  pass.uniforms.uVignette.value  = vignette
  pass.uniforms.uGlitch.value    = glitch
  pass.tick                      = ({ elapsed }) => {
    pass.uniforms.uTime.value = elapsed
  }
  return pass
}

/**
 * Invert the CRT warp for picking: pass pointer NDC coords + the pass's
 * curvature and raycast with the returned NDC instead. Compatible with the
 * `distortion` hook of architecture/pick.ts.
 */
type CrtCorrectPointerReturnType = { x: number; y: number }

export function crtCorrectPointer (ndcX: number, ndcY: number, curvature: number): CrtCorrectPointerReturnType {
  // forward warp is p' = p * (1 + k·|p|²); invert with 2 fixed-point iterations
  // (k is small, convergence is immediate at screen scales).
  let x = ndcX
  let y = ndcY
  for (let i = 0; i < 2; i++) {
    const r2 = x * x + y * y
    x = ndcX / (1 + curvature * r2)
    y = ndcY / (1 + curvature * r2)
  }
  return { x, y }
}

export type { ShaderPass }

// perf: low. three taps + arithmetic per pixel.
