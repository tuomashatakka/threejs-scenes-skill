// lib/animation/mixer.ts
// AnimationMixer convenience layer. createAnimationController wraps a mixer +
// its actions with play/crossfade/stop and a tick(ctx) that advances by
// ctx.delta. Pass a FrameLoop and it auto-registers the tick — wiring imported
// .glb animations or programmatic clips (./clips) into the render loop in one
// call. dispose() unregisters + uncaches so nothing leaks.
import * as THREE from 'three';
export function createAnimationController(root, clips = [], loop) {
    const mixer = new THREE.AnimationMixer(root);
    const actions = new Map();
    for (const clip of clips)
        actions.set(clip.name, mixer.clipAction(clip));
    function play(name, options = {}) {
        const action = actions.get(name);
        if (!action)
            return null;
        if (options.reset)
            action.reset();
        if (options.loop !== undefined)
            action.setLoop(options.loop, Infinity);
        if (options.clampWhenFinished !== undefined)
            action.clampWhenFinished = options.clampWhenFinished;
        if (options.timeScale !== undefined)
            action.setEffectiveTimeScale(options.timeScale);
        if (options.fadeIn)
            action.fadeIn(options.fadeIn);
        action.play();
        return action;
    }
    function crossfade(from, to, duration = 0.4) {
        const a = actions.get(from);
        const b = actions.get(to);
        if (!b)
            return;
        b.reset().play();
        if (a)
            a.crossFadeTo(b, duration, false);
        else
            b.fadeIn(duration);
    }
    function stop(name) {
        if (name)
            actions.get(name)?.stop();
        else
            mixer.stopAllAction();
    }
    function tick(ctx) {
        mixer.update(ctx.delta);
    }
    const unregister = loop ? loop.registerUpdate(tick) : null;
    function dispose() {
        unregister?.();
        mixer.stopAllAction();
        mixer.uncacheRoot(root);
        actions.clear();
    }
    return { mixer, actions, play, crossfade, stop, tick, dispose };
}
// perf: one mixer per animated root. mixer.update is cheap; the cost scales with
// active tracks. Crossfades blend on the CPU and free the faded-out action.
//# sourceMappingURL=mixer.js.map