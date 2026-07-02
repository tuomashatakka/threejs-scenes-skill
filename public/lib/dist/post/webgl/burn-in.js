// lib/post/webgl/burn-in.ts
// Phosphor burn-in / persistence pass: each frame is max-blended with a
// decaying copy of the previous output, so bright pixels leave fading trails —
// the CRT phosphor look. Ping-pong history targets, like the AfterimagePass
// but with max() blending (afterimage lerps, which greys trails out; max keeps
// them saturated). Ported from stellar-cartogrph's BurnInPass.
import * as THREE from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
const BLEND_SHADER = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse: { value: null },
        tHistory: { value: null },
        uDecay: { value: 0.92 },
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
    uniform sampler2D tHistory;
    uniform float uDecay;
    varying vec2 vUv;
    void main () {
      vec3 current = texture2D(tDiffuse, vUv).rgb;
      vec3 history = texture2D(tHistory, vUv).rgb * uDecay;
      gl_FragColor = vec4(max(current, history), 1.0);
    }
  `,
});
const COPY_SHADER = new THREE.ShaderMaterial({
    uniforms: { tDiffuse: { value: null } },
    vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main () {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
    fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    varying vec2 vUv;
    void main () {
      gl_FragColor = texture2D(tDiffuse, vUv);
    }
  `,
});
export class BurnInPass extends Pass {
    historyA;
    historyB;
    blendQuad = new FullScreenQuad(BLEND_SHADER.clone());
    copyQuad = new FullScreenQuad(COPY_SHADER.clone());
    constructor(decay = 0.92) {
        super();
        this.historyA = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
        this.historyB = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
        this.setDecay(decay);
    }
    setDecay(decay) {
        this.blendQuad.material.uniforms.uDecay.value = decay;
    }
    setSize(width, height) {
        this.historyA.setSize(width, height);
        this.historyB.setSize(width, height);
    }
    render(renderer, writeBuffer, readBuffer) {
        const blend = this.blendQuad.material;
        blend.uniforms.tDiffuse.value = readBuffer.texture;
        blend.uniforms.tHistory.value = this.historyA.texture;
        // blend into the other history target...
        renderer.setRenderTarget(this.historyB);
        this.blendQuad.render(renderer);
        // ...then copy it out to the chain
        const copy = this.copyQuad.material;
        copy.uniforms.tDiffuse.value = this.historyB.texture;
        renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
        this.copyQuad.render(renderer);
        // swap
        const tmp = this.historyA;
        this.historyA = this.historyB;
        this.historyB = tmp;
    }
    dispose() {
        this.historyA.dispose();
        this.historyB.dispose();
        this.blendQuad.material.dispose();
        this.copyQuad.material.dispose();
        this.blendQuad.dispose();
        this.copyQuad.dispose();
    }
}
export function createBurnInPass({ decay = 0.92 } = {}) {
    return new BurnInPass(decay);
}
// perf: medium. two extra fullscreen passes + two persistent half-float targets.
//# sourceMappingURL=burn-in.js.map