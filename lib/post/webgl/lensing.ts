// lib/post/webgl/lensing.ts
// Screen-space gravitational lensing: pixels near a screen-space center are
// pulled around it, with an optional dark core (event horizon). Drive uCenter
// each frame from core/projection.ts projectToScreenUv on the lensing body.
// Ported from stellar-cartogrph's lensing shader.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const LENSING_SHADER = {
  uniforms: {
    tDiffuse:  { value: null },
    uCenter:   { value: new THREE.Vector2(0.5, 0.5) },
    uRadius:   { value: 0.25 },
    uStrength: { value: 0.5 },
    uCoreSize: { value: 0.02 },
    uAspect:   { value: 1 },
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
    uniform float uRadius, uStrength, uCoreSize, uAspect;
    varying vec2 vUv;
    void main () {
      vec2 toCenter = vUv - uCenter;
      toCenter.x *= uAspect;
      float dist = length(toCenter);
      // deflection falls off with distance, scaled inside the influence radius
      float deflect = uStrength * uRadius * uRadius / max(dist, 1e-4);
      float influence = smoothstep(uRadius, 0.0, dist);
      vec2 offset = normalize(toCenter) * deflect * influence;
      offset.x /= uAspect;
      vec3 c = texture2D(tDiffuse, vUv - offset).rgb;
      // event horizon: darken inside the core
      c *= smoothstep(uCoreSize * 0.6, uCoreSize, dist);
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}

export interface LensingOptions {

  /** Influence radius in UV units. */
  radius?:   number
  strength?: number

  /** Dark-core (event horizon) radius in UV units; 0 disables. */
  coreSize?: number
}

export interface LensingPass extends ShaderPass {

  /** Point the lens at a screen UV (see core/projection.ts). */
  setCenter (u: number, v: number): void
  setSize (width: number, height: number): void
}

export function createLensingPass ({ radius = 0.25, strength = 0.5, coreSize = 0.02 }: LensingOptions = {}): LensingPass {
  const pass = new ShaderPass(LENSING_SHADER) as LensingPass

  pass.uniforms.uRadius.value   = radius
  pass.uniforms.uStrength.value = strength
  pass.uniforms.uCoreSize.value = coreSize
  pass.setCenter                = (u, v) => {
    (pass.uniforms.uCenter.value as THREE.Vector2).set(u, v)
  }
  pass.setSize = (width, height) => {
    pass.uniforms.uAspect.value = width / height
  }
  return pass
}

// perf: low. one tap + arithmetic per pixel.
