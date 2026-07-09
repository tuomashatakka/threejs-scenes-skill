// lib/post/hud-beam-transition.ts
// Horizontal phase-in transition. A luminous beam sweeps left→right, revealing
// content with RGB-split fringes. Midpoint callback fires the exact frame the
// beam crosses 0.5 — swap content there so the beam masks the cut. Ported from
// scripts/hud-beam-transition.js.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const HUD_BEAM_SHADER = {
  uniforms: {
    tDiffuse:   { value: null },
    uProgress:  { value: 0 },
    uBeamWidth: { value: 0.08 },
    uBeamColor: { value: new THREE.Color('#79f7ff') },
    uFringe:    { value: 0.02 },
    uNoiseAmp:  { value: 0.01 },
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
    uniform float uProgress, uBeamWidth, uFringe, uNoiseAmp, uTime;
    uniform vec3 uBeamColor;
    varying vec2 vUv;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main () {
      float beamX = uProgress;
      float dist = vUv.x - beamX;
      float beam = exp(-pow(dist / uBeamWidth, 2.0));
      float reveal = step(0.0, -dist);
      float fringeOffset = beam * uFringe;
      float noise = (hash(vUv * 256.0 + uTime) - 0.5) * uNoiseAmp * beam;
      vec2 uv = vUv + vec2(noise, 0.0);
      float r = texture2D(tDiffuse, uv + vec2(fringeOffset, 0.0)).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - vec2(fringeOffset, 0.0)).b;
      vec3 base = vec3(r, g, b) * reveal;
      vec3 glow = uBeamColor * beam * 1.4;
      gl_FragColor = vec4(base + glow, 1.0);
    }
  `,
}

/** Options for {@link createHudBeamTransition}. */
export interface HudBeamOptions {
  duration?:   number
  beamWidth?:  number
  beamColor?:  THREE.ColorRepresentation
  onComplete?: () => void
}

/** Handle returned by {@link createHudBeamTransition} with play/tick controls. */
export interface HudBeamTransition {
  pass: ShaderPass
  play (onMidpoint?: () => void): void
  tick (delta: number, time: number): void
}

/** Create a horizontal beam-sweep transition that reveals content with RGB-split fringes. Call tick() each frame and play() to trigger. */
export function createHudBeamTransition ({
  duration = 0.9,
  beamWidth = 0.08,
  beamColor = '#79f7ff',
  onComplete,
}: HudBeamOptions = {}): HudBeamTransition {
  const pass                     = new ShaderPass(HUD_BEAM_SHADER)
  pass.uniforms.uBeamWidth.value = beamWidth
  pass.uniforms.uBeamColor.value = new THREE.Color(beamColor)
  pass.enabled                   = false

  let elapsed                    = 0
  let running                    = false
  let halfFired                  = false
  let onMid: (() => void) | null = null

  function play (onMidpoint?: () => void): void {
    elapsed = 0
    running = true
    halfFired = false
    pass.enabled = true
    onMid = onMidpoint ?? null
  }

  function tick (delta: number, time: number): void {
    pass.uniforms.uTime.value = time
    if (!running)
      return
    elapsed += delta

    const progress                = Math.min(elapsed / duration, 1)
    pass.uniforms.uProgress.value = progress
    if (!halfFired && progress >= 0.5) {
      halfFired = true
      onMid?.()
    }
    if (progress >= 1) {
      running = false
      pass.enabled = false
      onComplete?.()
    }
  }

  return { pass, play, tick }
}

// perf: cheap when disabled (gated by pass.enabled). Medium during playback.
