// lib/post/webgl/bloom-selective.ts
// Selective bloom — only objects you opt in glow, the rest stay sharp. WebGL
// equivalent of the WebGPU `webgpu/bloom-selective.ts`. WebGL has no emissive
// MRT channel, so this uses the canonical two-composer technique: render the
// scene with non-bloom objects swapped to black, bloom that buffer, then
// additively composite it over a normal render via a mix shader. Returns a
// stateful handle (not a single Pass) — drive it with `handle.render()`.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
// Objects on this layer bloom. Enable it on a mesh with `obj.layers.enable(BLOOM_LAYER)`.
export const BLOOM_LAYER = 1;
export function createSelectiveBloom(ctx, options = {}) {
    const { renderer, scene, camera, width, height } = ctx;
    const { strength = 1, radius = 0.4, threshold = 0 } = options;
    const bloomLayer = new THREE.Layers();
    bloomLayer.set(BLOOM_LAYER);
    const darkMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const saved = new Map();
    // Bloom pass: renders only the bright/marked objects, blurred. Not to screen.
    const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), strength, radius, threshold);
    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(new RenderPass(scene, camera));
    bloomComposer.addPass(bloom);
    // Mix pass: scene colour + bloom buffer, additively.
    const mixPass = new ShaderPass(new THREE.ShaderMaterial({
        uniforms: {
            baseTexture: { value: null },
            bloomTexture: { value: bloomComposer.renderTarget2.texture },
        },
        vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main () { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
      `,
        fragmentShader: /* glsl */ `
        uniform sampler2D baseTexture;
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main () {
          gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv);
        }
      `,
        defines: {},
    }), 'baseTexture');
    mixPass.needsSwap = true;
    const finalComposer = new EffectComposer(renderer);
    finalComposer.addPass(new RenderPass(scene, camera));
    finalComposer.addPass(mixPass);
    finalComposer.addPass(new OutputPass());
    bloomComposer.setSize(width, height);
    finalComposer.setSize(width, height);
    function darken(obj) {
        const mesh = obj;
        if (mesh.isMesh && bloomLayer.test(obj.layers) === false) {
            saved.set(obj.uuid, mesh.material);
            mesh.material = darkMaterial;
        }
    }
    function restore(obj) {
        if (saved.has(obj.uuid)) {
            obj.material = saved.get(obj.uuid);
            saved.delete(obj.uuid);
        }
    }
    return {
        bloomComposer,
        finalComposer,
        bloom,
        markBloom(object, recursive = true) {
            if (recursive)
                object.traverse(o => o.layers.enable(BLOOM_LAYER));
            else
                object.layers.enable(BLOOM_LAYER);
        },
        unmarkBloom(object, recursive = true) {
            if (recursive)
                object.traverse(o => o.layers.disable(BLOOM_LAYER));
            else
                object.layers.disable(BLOOM_LAYER);
        },
        render() {
            scene.traverse(darken);
            bloomComposer.render();
            scene.traverse(restore);
            finalComposer.render();
        },
        setSize(w, h) {
            bloomComposer.setSize(w, h);
            finalComposer.setSize(w, h);
            bloom.setSize(w, h);
        },
        dispose() {
            bloomComposer.dispose();
            finalComposer.dispose();
            darkMaterial.dispose();
        },
    };
}
// perf: medium-expensive. Two full composer chains; the scene is rendered twice.
//# sourceMappingURL=bloom-selective.js.map