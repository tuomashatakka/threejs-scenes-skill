// lib/post/webgpu/pipeline.ts
// Entry points for the WebGPU/TSL post-processing pipeline. Build a scene pass,
// optionally expose normal + viewZ via MRT for geometry-aware effects, then wrap
// it all in a RenderPipeline instance whose outputNode is the composed chain.
//
// RenderPipeline replaces the deprecated PostProcessing class (PostProcessing was
// renamed to RenderPipeline in r183 and is now only a back-compat wrapper that
// will be removed). The surface is identical: `new RenderPipeline(renderer)`,
// assign `.outputNode`, call `.render()` each frame, set `.needsUpdate = true`
// after swapping the output node. See https://threejs.org/docs/#RenderPipeline.
import { RenderPipeline } from 'three/webgpu';
import { pass, mrt, output, normalView, velocity, emissive, metalness, roughness, directionToColor, vec2, vec4, } from 'three/tsl';
// Basic colour-only scene pass — enough for bloom, dof, ca, fxaa, etc.
export function createScenePass(scene, camera) {
    const scenePass = pass(scene, camera);
    return {
        pass: scenePass,
        color: scenePass.getTextureNode('output'),
        viewZ: scenePass.getViewZNode(),
        normal: normalView,
    };
}
// Scene pass with a multiple-render-target layout exposing a normal buffer.
// Required by geometry-aware effects (ao, ssr, ssgi, sss, traa) so they can read
// per-pixel normals and linear depth instead of re-rendering the scene.
export function createScenePassMRT(scene, camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, normal: normalView }));
    return {
        pass: scenePass,
        color: scenePass.getTextureNode('output'),
        viewZ: scenePass.getViewZNode(),
        normal: scenePass.getTextureNode('normal'),
    };
}
// Scene pass exposing per-pixel screen-space velocity (for motion blur / TRAA).
// Read it back with `scenePass.getTextureNode('velocity')`.
export function createScenePassVelocity(scene, camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, velocity }));
    return scenePass;
}
// Scene pass exposing the emissive contribution as its own channel, so emissive
// bloom can bloom only the glowing parts. The example narrows the emissive
// attachment to a byte texture to save bandwidth — do that on the returned pass
// if needed (`scenePass.getTexture('emissive').type = THREE.UnsignedByteType`).
export function createScenePassEmissive(scene, camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({ output, emissive: vec4(emissive, output.a) }));
    return scenePass;
}
// Scene pass for SSR: encodes view normals to colour and packs metalness +
// roughness into a single attachment. Read normals back with
// `colorToDirection(scenePass.getTextureNode('normal'))` and the packed material
// channels from `.r` / `.g` of the metalrough texture.
export function createScenePassSSR(scene, camera) {
    const scenePass = pass(scene, camera);
    scenePass.setMRT(mrt({
        output,
        normal: directionToColor(normalView),
        metalrough: vec2(metalness, roughness),
    }));
    return scenePass;
}
// Wrap a composed output node in a RenderPipeline instance ready to render.
// Drive it from the animation loop with `pipeline.render()` (replaces
// `renderer.render(scene, camera)`); after reassigning `.outputNode` at runtime,
// set `.needsUpdate = true`. perf: one RenderPipeline per scene; dispose on teardown.
export function createRenderPipeline(renderer, outputNode) {
    const pipeline = new RenderPipeline(renderer);
    pipeline.outputNode = outputNode;
    return pipeline;
}
/**
 * @deprecated Renamed to {@link createRenderPipeline}. PostProcessing was renamed
 * to RenderPipeline in three.js r183; this alias is kept for back-compat and will
 * be removed alongside three's PostProcessing wrapper.
 */
export const createPostProcessing = createRenderPipeline;
//# sourceMappingURL=pipeline.js.map