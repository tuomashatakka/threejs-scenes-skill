// lib/props/registry.ts
// Prop resolution. resolveProp turns a <Prop src> value into a live PropInstance,
// dispatching across three source kinds:
//   1. a PropFactory object        -> createProp (sync, wrapped in a resolved promise)
//   2. a registered name           -> createProp from the registry
//   3. a model file (.glb/.gltf)   -> loadModel, wrap scene + animations
//   4. otherwise a module path     -> dynamic import(), use its prop export
// Everything returns a Promise<PropInstance> so callers have one code path.
import * as THREE from 'three';
import { createProp } from './prop.js';
import { loadModel } from '../loaders/model-registry.js';
import { createAnimationController } from '../animation/mixer.js';
import { disposeScene } from '../core/dispose.js';
const registry = new Map();
export function registerProp(name, factory) {
    registry.set(name, factory);
}
export function getProp(name) {
    return registry.get(name);
}
function isFactory(value) {
    return typeof value === 'object' && value !== null && typeof value.build === 'function';
}
function isModelFile(src) {
    return (/\.(glb|gltf)(\?|#|$)/i).test(src);
}
function wrapModel(object, clips, ctx) {
    let controller;
    if (clips.length) {
        controller = createAnimationController(object, clips, ctx.loop);
        for (const clip of clips)
            controller.play(clip.name, { loop: THREE.LoopRepeat });
    }
    return {
        object,
        controller,
        lights: [],
        dispose() {
            controller?.dispose();
            disposeScene(object);
        },
    };
}
export async function resolveProp(src, ctx = {}) {
    if (isFactory(src))
        return createProp(src, ctx);
    const registered = registry.get(src);
    if (registered)
        return createProp(registered, ctx);
    if (isModelFile(src)) {
        const model = await loadModel(src);
        return wrapModel(model.scene, model.animations, ctx);
    }
    // module path — expect a default or `prop` export that is a PropFactory.
    const mod = await import(/* @vite-ignore */ src);
    const factory = (mod.default ?? mod.prop);
    if (!isFactory(factory))
        throw new Error(`resolveProp: ${src} has no default/prop PropFactory export`);
    return createProp(factory, ctx);
}
// perf: registry + model cache (loaders) dedupe repeats. Dynamic import is one
// network/module fetch the first time, then cached by the runtime.
//# sourceMappingURL=registry.js.map