// lib/post/grade-pass.ts
// Colour grade pass. Per production-lessons.md the canonical chain is
// RenderPass → UnrealBloomPass → ShaderPass(grade) → OutputPass, with the grade
// running in linear HDR (scene-referred), BEFORE tone-mapping. It applies tint,
// contrast around mid-grey, saturation, a soft radial vignette, seeded grain,
// and radial chromatic aberration that grows toward the corners
// (split ∝ dot(centerOffset, centerOffset)). Tone-map exactly once, at the
// OutputPass — do NOT also set renderer.toneMapping.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


/** Raw ShaderPass shader definition for colour grading: tint, contrast, saturation, vignette, grain, and radial chromatic aberration. Runs in linear HDR before tone-mapping. */
export const GradeShader = {
  uniforms: {
    tDiffuse:    { value: null },
    uTime:       { value: 0 },
    uTint:       { value: new THREE.Color('#ffffff') },
    uContrast:   { value: 1.05 },
    uSaturation: { value: 1.1 },
    uVignette:   { value: 0.35 },
    uGrain:      { value: 0.04 },
    uChromatic:  { value: 0.6 },
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
    uniform float uTime, uContrast, uSaturation, uVignette, uGrain, uChromatic;
    uniform vec3 uTint;
    varying vec2 vUv;
    float hash (vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    void main () {
      vec2 center = vUv - 0.5;
      // radial chromatic aberration: split grows toward the corners.
      float split = dot(center, center) * uChromatic * 0.02;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + center * split).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - center * split).b;

      // grade in linear HDR, before tone-mapping
      col *= uTint;
      col = (col - 0.5) * uContrast + 0.5;
      float luma = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(vec3(luma), col, uSaturation);

      // soft radial vignette
      float vig = smoothstep(0.8, 0.2, length(center)) ;
      col *= mix(1.0, vig, uVignette);

      // seeded grain
      float g = (hash(vUv * 1024.0 + uTime) - 0.5) * uGrain;
      col += g;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

/** Options for {@link createGradePass}. */
export interface GradePassOptions {
  tint?:       THREE.ColorRepresentation
  contrast?:   number
  saturation?: number
  vignette?:   number
  grain?:      number
  chromatic?:  number
}

/** Colour-grade pass with a setTime() method to animate seeded grain. */
export interface GradePass extends ShaderPass {
  setTime (elapsed: number): void
}

/** Create a ShaderPass that applies tint, contrast, saturation, vignette, seeded grain, and radial chromatic aberration in linear HDR. Place before OutputPass (tone-mapping). */
export function createGradePass ({
  tint = '#ffffff',
  contrast = 1.05,
  saturation = 1.1,
  vignette = 0.35,
  grain = 0.04,
  chromatic = 0.6,
}: GradePassOptions = {}): GradePass {
  const pass                      = new ShaderPass(GradeShader) as GradePass
  pass.uniforms.uTint.value       = new THREE.Color(tint)
  pass.uniforms.uContrast.value   = contrast
  pass.uniforms.uSaturation.value = saturation
  pass.uniforms.uVignette.value   = vignette
  pass.uniforms.uGrain.value      = grain
  pass.uniforms.uChromatic.value  = chromatic

  pass.setTime = elapsed => {
    pass.uniforms.uTime.value = elapsed
  }

  return pass
}

// perf: cheap-medium. one fullscreen pass; 3 texture taps for the CA split.
