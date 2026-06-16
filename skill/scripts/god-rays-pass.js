// scripts/god-rays-pass.js
// Volumetric light shafts via screen-space radial blur sampled toward the
// light's screen-space position. Cheaper than true volumetrics; light must be
// in front of the camera for the effect to register.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const GOD_RAYS_SHADER = {
  uniforms: {
    tDiffuse:  { value: null },
    uLightPos: { value: new THREE.Vector2(0.5, 0.7) },
    uExposure: { value: 0.18 },
    uDecay:    { value: 0.95 },
    uDensity:  { value: 0.9 },
    uWeight:   { value: 0.4 },
    uSamples:  { value: 60 },
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
    uniform vec2 uLightPos;
    uniform float uExposure, uDecay, uDensity, uWeight;
    uniform int uSamples;
    varying vec2 vUv;
    void main () {
      vec2 texCoord = vUv;
      vec2 deltaTex = (vUv - uLightPos) * (1.0 / float(uSamples)) * uDensity;
      float illumDecay = 1.0;
      vec4 color = texture2D(tDiffuse, vUv);
      for (int i = 0; i < 100; i++) {
        if (i >= uSamples) break;
        texCoord -= deltaTex;
        vec4 s = texture2D(tDiffuse, texCoord);
        s *= illumDecay * uWeight;
        color += s;
        illumDecay *= uDecay;
      }
      gl_FragColor = color * uExposure;
    }
  `,
}

const projected = new THREE.Vector3()

export function createGodRaysPass () {
  const pass = new ShaderPass(GOD_RAYS_SHADER)

  pass.updateFromLight = (lightWorldPos, camera) => {
    projected.copy(lightWorldPos).project(camera)
    pass.uniforms.uLightPos.value.set(
      projected.x * 0.5 + 0.5,
      projected.y * 0.5 + 0.5,
    )
    // disable the pass when the light is behind the camera
    pass.enabled = projected.z < 1
  }

  return pass
}

// perf: medium-expensive. 60 samples per fragment. Reduce uSamples for mobile.
