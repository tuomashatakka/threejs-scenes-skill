// lib/post/webgl/motion-blur.ts
// Camera motion blur via depth reprojection. WebGL equivalent of the WebGPU
// `webgpu/motion-blur.ts` (which samples a free MRT velocity buffer). WebGL has
// no cheap velocity buffer here, so we reconstruct each fragment's world
// position from the depth buffer, reproject it through the PREVIOUS frame's
// view-projection matrix, and smear along the resulting screen-space velocity.
// Requires the composer's depth texture (createComposer({ withDepth: true })).
// Call `update(camera)` once per frame BEFORE composer.render().

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const MOTION_BLUR_SHADER = {
  uniforms: {
    tDiffuse:         { value: null },
    tDepth:           { value: null },
    uPrevViewProj:    { value: new THREE.Matrix4() },
    uInverseViewProj: { value: new THREE.Matrix4() },
    uIntensity:       { value: 1 },
    uSamples:         { value: 16 },
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
    uniform sampler2D tDepth;
    uniform mat4 uPrevViewProj;
    uniform mat4 uInverseViewProj;
    uniform float uIntensity;
    uniform int uSamples;
    varying vec2 vUv;
    void main () {
      float depth = texture2D(tDepth, vUv).r;
      // Reconstruct clip-space, unproject to world, reproject with prev matrix.
      vec4 ndc   = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
      vec4 world = uInverseViewProj * ndc;
      world     /= world.w;
      vec4 prevClip = uPrevViewProj * world;
      vec2 prevUv   = (prevClip.xy / prevClip.w) * 0.5 + 0.5;
      vec2 velocity = (vUv - prevUv) * uIntensity;

      vec4 sum = vec4(0.0);
      for (int i = 0; i < 32; i++) {
        if (i >= uSamples) break;
        float t = float(i) / float(uSamples) - 0.5;
        sum += texture2D(tDiffuse, vUv - velocity * t);
      }
      gl_FragColor = sum / float(uSamples);
    }
  `,
}

export interface MotionBlurOptions {
  // Length of the smear. 0 disables.
  intensity?:    number
  // Taps along the velocity vector (kept under 32).
  samples?:      number
  // The scene depth texture (composer.renderTarget1.depthTexture).
  depthTexture?: THREE.Texture | null
}

export interface MotionBlurPass extends ShaderPass {
  // Refresh the reprojection matrices. Call once per frame before render.
  update (camera: THREE.Camera): void
  setDepthTexture (texture: THREE.Texture | null): void
}

export function createMotionBlur (options: MotionBlurOptions = {}): MotionBlurPass {
  const { intensity = 1, samples = 16, depthTexture = null } = options
  const pass                                                 = new ShaderPass(MOTION_BLUR_SHADER) as MotionBlurPass
  pass.uniforms.uIntensity.value                             = intensity
  pass.uniforms.uSamples.value                               = Math.min(samples, 32)
  pass.uniforms.tDepth.value                                 = depthTexture

  // Maintain current + previous view-projection matrices across frames.
  const cur  = new THREE.Matrix4()
  const prev = new THREE.Matrix4()
  let hasPrev = false

  pass.update = camera => {
    cur.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    (pass.uniforms.uInverseViewProj.value as THREE.Matrix4).copy(cur).invert()
    if (!hasPrev) {
      prev.copy(cur)
      hasPrev = true
    }
    (pass.uniforms.uPrevViewProj.value as THREE.Matrix4).copy(prev)
    prev.copy(cur)
  }

  pass.setDepthTexture = texture => {
    pass.uniforms.tDepth.value = texture
  }
  return pass
}

// perf: medium. up to `samples` taps + a matrix unproject per fragment.
