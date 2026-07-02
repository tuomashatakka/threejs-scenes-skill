// lib/post/pipeline.ts
// Reorderable named-pass pipeline over EffectComposer — the WebGL sibling of
// post/webgpu/pipeline.ts. Register passes by name once; drive order and
// enablement from serializable config (a string[] + a flags record persists in
// app state / localStorage). RenderPass stays first, OutputPass stays last.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
export function createPostPipeline({ renderer, scene, camera, width, height, withDepth = false, }) {
    const composer = new EffectComposer(renderer);
    composer.setSize(width, height);
    if (withDepth) {
        const depthTexture = new THREE.DepthTexture(width, height);
        depthTexture.format = THREE.DepthFormat;
        depthTexture.type = THREE.UnsignedIntType;
        composer.renderTarget1.depthTexture = depthTexture;
        composer.renderTarget2.depthTexture = depthTexture;
    }
    const renderPass = new RenderPass(scene, camera);
    const outputPass = new OutputPass();
    const registered = new Map();
    let order = [];
    function rebuild() {
        composer.passes.length = 0;
        composer.addPass(renderPass);
        for (const name of order) {
            const pass = registered.get(name);
            if (pass)
                composer.addPass(pass);
        }
        // anything registered but not ordered runs after the ordered chain
        for (const [name, pass] of registered)
            if (!order.includes(name))
                composer.addPass(pass);
        composer.addPass(outputPass);
    }
    rebuild();
    return {
        composer,
        register(name, pass) {
            registered.set(name, pass);
            if (!order.includes(name))
                order.push(name);
            rebuild();
        },
        setOrder(next) {
            const known = next.filter(name => registered.has(name));
            const rest = [...registered.keys()].filter(name => !known.includes(name));
            order = [...known, ...rest];
            rebuild();
        },
        setEnabled(flags) {
            for (const [name, enabled] of Object.entries(flags)) {
                const pass = registered.get(name);
                if (pass)
                    pass.enabled = enabled;
            }
        },
        getOrder: () => [...order],
        get: name => registered.get(name),
        render(delta = 0) {
            composer.render(delta);
        },
        setSize(w, h) {
            composer.setSize(w, h);
            for (const pass of registered.values())
                pass.setSize(w, h);
            const depth = composer.renderTarget1.depthTexture;
            if (depth) {
                depth.image.width = w;
                depth.image.height = h;
            }
        },
        dispose() {
            composer.dispose();
        },
    };
}
// perf: medium. each enabled pass = one fullscreen shader; rebuild() is an
// array splice, safe to call from UI handlers.
//# sourceMappingURL=pipeline.js.map