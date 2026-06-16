// lib/props/prop.ts
// Prop factory. A "prop" bundles an Object3D with optional animation clips,
// embedded light sources, and an instancing hint behind one declarative
// definition. defineProp authors it; createProp mounts a live PropInstance —
// building the object, parenting its lights, wiring an AnimationController
// (auto-played, looping) onto ctx.loop, and exposing a single dispose().
import * as THREE from 'three';
import { createAnimationController } from '../animation/mixer.js';
import { disposeScene } from '../core/dispose.js';
/** Validate + tag a prop definition. The returned factory is what <Prop src> resolves to. */
export function defineProp(def) {
    if (!def.name)
        throw new Error('defineProp: a `name` is required');
    return def;
}
export function createProp(factory, ctx = {}, options = {}) {
    const { autoplay = true } = options;
    const object = factory.build(ctx);
    const lights = factory.lights?.(object) ?? [];
    for (const light of lights)
        object.add(light);
    const clips = factory.clips?.(object) ?? [];
    let controller;
    if (clips.length) {
        controller = createAnimationController(object, clips, ctx.loop);
        if (autoplay)
            for (const clip of clips)
                controller.play(clip.name, { loop: THREE.LoopRepeat });
    }
    function dispose() {
        controller?.dispose();
        for (const light of lights) {
            light.parent?.remove(light);
            light.dispose();
        }
        disposeScene(object);
    }
    return { object, controller, lights, dispose };
}
// perf: one prop = one (or few) draw calls unless instanced. The controller tick
// is registered once on the loop; dispose unregisters it and frees GPU memory.
//# sourceMappingURL=prop.js.map