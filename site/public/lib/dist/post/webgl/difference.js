// lib/post/webgl/difference.ts
// Difference blend — shows the absolute per-channel difference between the
// incoming scene and a second reference texture. WebGL ShaderPass equivalent of
// the WebGPU `webgpu/difference.ts` effect (used for visual diffing / comparing
// two render states). Bind the comparison texture with `setCompareTexture`.
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
const DIFFERENCE_SHADER = {
    uniforms: {
        tDiffuse: { value: null },
        tCompare: { value: null },
        uScale: { value: 1 },
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
    uniform sampler2D tCompare;
    uniform float uScale;
    varying vec2 vUv;
    void main () {
      vec4 a = texture2D(tDiffuse, vUv);
      vec4 b = texture2D(tCompare, vUv);
      gl_FragColor = vec4(abs(a.rgb - b.rgb) * uScale, 1.0);
    }
  `,
};
export function createDifference(options = {}) {
    const { compare = null, scale = 1 } = options;
    const pass = new ShaderPass(DIFFERENCE_SHADER);
    pass.uniforms.tCompare.value = compare;
    pass.uniforms.uScale.value = scale;
    pass.setCompareTexture = texture => {
        pass.uniforms.tCompare.value = texture;
    };
    return pass;
}
// perf: low. Two taps + abs.
//# sourceMappingURL=difference.js.map