// lib/post/god-rays-pass.ts
// Volumetric light shafts via screen-space radial scattering toward the light's
// screen-space position. Cheaper than true volumetrics; the light must be in
// front of the camera for the effect to register.
//
// Faithful port of Erkaman/glsl-godrays (index.glsl), itself the classic
// GPU Gems 3 ch.13 / Mitchell light-shaft algorithm. The reference `godrays()`
// returns a PURE ADDITIVE scatter term: it marches from the fragment toward the
// light, accumulating brightness from an occlusion source starting at zero, and
// scales ONLY that accumulation by exposure. We composite it as
// `sceneColor + rays` — the scatter is added on top of the lit scene, never
// folded into it. (The previous implementation seeded the accumulator with the
// base colour and multiplied the whole result by exposure, which darkened and
// double-counted the scene.)
//
// Occlusion source: ideally a masked buffer where only the light/bright emitters
// are non-black and occluders are black (set via `setOcclusionTexture`). With no
// occlusion texture bound it falls back to sampling the scene colour directly,
// which works well when the scene has a bright sun sprite. Ported from
// scripts/god-rays-pass.js.
import * as THREE from 'three';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
const GOD_RAYS_SHADER = {
    uniforms: {
        tDiffuse: { value: null },
        tOcclusion: { value: null },
        uHasOcclusion: { value: false },
        uLightPos: { value: new THREE.Vector2(0.5, 0.7) },
        uExposure: { value: 0.25 },
        uDecay: { value: 0.95 },
        uDensity: { value: 0.9 },
        uWeight: { value: 0.4 },
        uSamples: { value: 60 },
    },
    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform sampler2D tOcclusion;
    uniform bool uHasOcclusion;
    uniform vec2 uLightPos;
    uniform float uExposure, uDecay, uDensity, uWeight;
    uniform int uSamples;
    varying vec2 vUv;

    // Verbatim algorithm from Erkaman/glsl-godrays: march from \`uv\` toward the
    // screen-space light position, accumulating occlusion-texture samples with a
    // decaying weight, then scale the sum by exposure. Returns the scatter term.
    vec3 godrays (
        float density, float weight, float decay, float exposure,
        int numSamples, sampler2D occlusionTexture,
        vec2 screenSpaceLightPos, vec2 uv
    ) {
      vec3 fragColor = vec3(0.0, 0.0, 0.0);
      vec2 deltaTextCoord = vec2(uv - screenSpaceLightPos.xy);
      vec2 textCoo = uv.xy;
      deltaTextCoord *= (1.0 / float(numSamples)) * density;
      float illuminationDecay = 1.0;

      // Fixed upper bound (WebGL can't loop a variable number of times); the
      // inner test stops at numSamples. Matches the reference's 100-cap + break.
      for (int i = 0; i < 100; i++) {
        if (numSamples < i) break;
        textCoo -= deltaTextCoord;
        vec3 samp = texture2D(occlusionTexture, textCoo).xyz;
        samp *= illuminationDecay * weight;
        fragColor += samp;
        illuminationDecay *= decay;
      }

      fragColor *= exposure;
      return fragColor;
    }

    void main () {
      vec4 base = texture2D(tDiffuse, vUv);
      // Branch on a uniform so the exact reference function (which takes one
      // sampler) can run against either the dedicated occlusion buffer or the
      // scene colour as a fallback occlusion source.
      vec3 rays = uHasOcclusion
        ? godrays(uDensity, uWeight, uDecay, uExposure, uSamples, tOcclusion, uLightPos, vUv)
        : godrays(uDensity, uWeight, uDecay, uExposure, uSamples, tDiffuse,   uLightPos, vUv);
      gl_FragColor = vec4(base.rgb + rays, base.a);
    }
  `,
};
const projected = new THREE.Vector3();
export function createGodRaysPass() {
    const pass = new ShaderPass(GOD_RAYS_SHADER);
    pass.updateFromLight = (lightWorldPos, camera) => {
        projected.copy(lightWorldPos).project(camera);
        pass.uniforms.uLightPos.value.set(projected.x * 0.5 + 0.5, projected.y * 0.5 + 0.5);
        // disable the pass when the light is behind the camera
        pass.enabled = projected.z < 1;
    };
    pass.setOcclusionTexture = texture => {
        pass.uniforms.tOcclusion.value = texture;
        pass.uniforms.uHasOcclusion.value = texture !== null;
    };
    return pass;
}
// perf: medium-expensive. Up to uSamples taps per fragment. Reduce uSamples for
// mobile. Defaults are tuned for additive compositing (base.rgb + rays); raise
// uExposure/uWeight for more pronounced shafts, lower them if the light blows out.
//# sourceMappingURL=god-rays-pass.js.map