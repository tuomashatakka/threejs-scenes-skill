// lib/post/dof-chromatic-pass.ts
// Depth of field + chromatic aberration in one pass. Blur radius driven by
// distance between fragment's linear depth and uFocalDistance; chromatic
// separation modulated by the same coc (circle of confusion). Requires
// composer.renderTarget1.depthTexture to be bound. Ported from
// scripts/dof-chromatic-pass.js.

import * as THREE from 'three'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'


const DOF_CA_SHADER = {
  uniforms: {
    tDiffuse:       { value: null },
    tDepth:         { value: null },
    uFocalDistance: { value: 10.0 },
    uFocalRange:    { value: 4.0 },
    uMaxBlur:       { value: 0.015 },
    uCAStrength:    { value: 0.5 },
    uNear:          { value: 0.1 },
    uFar:           { value: 200.0 },
    uAspect:        { value: 1.0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse, tDepth;
    uniform float uFocalDistance, uFocalRange, uMaxBlur, uCAStrength;
    uniform float uNear, uFar, uAspect;
    varying vec2 vUv;

    float linearizeDepth (float z) {
      float ndc = z * 2.0 - 1.0;
      return (2.0 * uNear * uFar) / (uFar + uNear - ndc * (uFar - uNear));
    }

    vec3 sampleCA (vec2 uv, float coc) {
      vec2 dir = vec2(uv.x - 0.5, uv.y - 0.5);
      float len = max(length(dir), 1e-4);
      vec2 normDir = dir / len;
      float ca = coc * uCAStrength * 0.01;
      float r = texture2D(tDiffuse, uv + normDir * ca).r;
      float g = texture2D(tDiffuse, uv).g;
      float b = texture2D(tDiffuse, uv - normDir * ca).b;
      return vec3(r, g, b);
    }

    const int TAPS = 12;
    const vec2 POISSON[12] = vec2[](
      vec2( 0.000,  0.000), vec2( 0.500,  0.250), vec2(-0.250,  0.500),
      vec2(-0.500, -0.250), vec2( 0.250, -0.500), vec2( 0.750,  0.000),
      vec2( 0.000,  0.750), vec2(-0.750,  0.000), vec2( 0.000, -0.750),
      vec2( 0.530,  0.530), vec2(-0.530,  0.530), vec2(-0.530, -0.530)
    );

    void main () {
      float d = linearizeDepth(texture2D(tDepth, vUv).r);
      float coc = clamp(abs(d - uFocalDistance) / uFocalRange, 0.0, 1.0);
      float radius = coc * uMaxBlur;
      vec3 sum = vec3(0.0);
      for (int i = 0; i < TAPS; i++) {
        vec2 off = POISSON[i] * radius * vec2(1.0, uAspect);
        sum += sampleCA(vUv + off, coc);
      }
      gl_FragColor = vec4(sum / float(TAPS), 1.0);
    }
  `,
}

const focalScratch = new THREE.Vector3()

/** Options for {@link createDofPass}. */
export interface DofPassOptions {
  focalDistance?: number
  focalRange?:    number
  maxBlur?:       number
  caStrength?:    number
  near?:          number
  far?:           number
}

/** Combined depth-of-field and chromatic-aberration pass. */
export interface DofPass extends ShaderPass {
  focusOn (worldPos: THREE.Vector3, camera: THREE.Camera): void
  setAspect (aspect: number): void
}

/** Create a ShaderPass that applies depth-of-field blur modulated by circle-of-confusion, with radial chromatic separation. Requires a DepthTexture on the composer render target. */
export function createDofPass ({
  focalDistance = 10,
  focalRange = 4,
  maxBlur = 0.015,
  caStrength = 0.5,
  near = 0.1,
  far = 200,
}: DofPassOptions = {}): DofPass {
  const pass                         = new ShaderPass(DOF_CA_SHADER) as DofPass
  pass.uniforms.uFocalDistance.value = focalDistance
  pass.uniforms.uFocalRange.value    = focalRange
  pass.uniforms.uMaxBlur.value       = maxBlur
  pass.uniforms.uCAStrength.value    = caStrength
  pass.uniforms.uNear.value          = near
  pass.uniforms.uFar.value           = far

  // dynamic focal point — pass a world-space Vector3 each frame.
  pass.focusOn = (worldPos, camera) => {
    focalScratch.copy(worldPos)

    const dist                         = focalScratch.distanceTo((camera as THREE.PerspectiveCamera).position)
    pass.uniforms.uFocalDistance.value = dist
  }

  pass.setAspect = aspect => {
    pass.uniforms.uAspect.value = aspect
  }

  return pass
}

// perf: medium-expensive. 12 taps × 3 samples (RGB) = 36 texture samples per
// fragment. Skip on mobile.
