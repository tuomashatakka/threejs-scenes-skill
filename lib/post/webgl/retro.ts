// lib/post/webgl/retro.ts
// Retro look — pixelation + colour-depth posterisation + CRT scanlines. WebGL
// ShaderPass equivalent of the WebGPU `webgpu/retro.ts` (RetroPassNode). Knobs:
// pixelSize, colorLevels, scanlineIntensity.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const RETRO_SHADER = {
  uniforms: {
    tDiffuse:           { value: null },
    uResolution:        { value: new THREE.Vector2(1, 1) },
    uPixelSize:         { value: 4 },
    uColorLevels:       { value: 8 },
    uScanlineIntensity: { value: 0.2 },
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
    uniform vec2 uResolution;
    uniform float uPixelSize, uColorLevels, uScanlineIntensity;
    varying vec2 vUv;
    void main () {
      // Snap UVs to a coarse pixel grid.
      vec2 dxy   = uPixelSize / uResolution;
      vec2 coord = dxy * floor(vUv / dxy);
      vec3 c = texture2D(tDiffuse, coord).rgb;
      // Posterise to a limited palette.
      c = floor(c * uColorLevels) / uColorLevels;
      // CRT scanline darkening.
      float scan = 0.5 + 0.5 * sin(vUv.y * uResolution.y * 3.14159265);
      c *= 1.0 - uScanlineIntensity * scan;
      gl_FragColor = vec4(c, 1.0);
    }
  `,
}

export interface RetroOptions {
  // Edge length (in device pixels) of one chunky pixel.
  pixelSize?:         number
  // Quantisation steps per channel (lower = more retro).
  colorLevels?:       number
  // Strength of the scanline darkening, [0,1].
  scanlineIntensity?: number
}

export interface RetroPass extends ShaderPass {
  setSize (width: number, height: number): void
}

export function createRetroPass (options: RetroOptions = {}): RetroPass {
  const { pixelSize = 4, colorLevels = 8, scanlineIntensity = 0.2 } = options
  const pass                                                        = new ShaderPass(RETRO_SHADER) as RetroPass
  pass.uniforms.uPixelSize.value                                    = pixelSize
  pass.uniforms.uColorLevels.value                                  = colorLevels
  pass.uniforms.uScanlineIntensity.value                            = scanlineIntensity
  pass.setSize                                                      = (width, height) => {
    (pass.uniforms.uResolution.value as THREE.Vector2).set(width, height)
  }
  return pass
}

// perf: low. Single tap + arithmetic.
