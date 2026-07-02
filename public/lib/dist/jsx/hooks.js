// lib/jsx/hooks.ts
// Hook-style access to the library's main interfaces. Two flavours:
//
// 1. Component hooks — callable ONLY inside a JSX function component while it
//    mounts (the reconciler sets the current runtime around each component
//    call, the same way React's dispatcher works). They read the mounting
//    runtime: useScene(), useRenderer(), useFrame(cb), …
//
// 2. Standalone hooks — callable anywhere: useFrameLoop() wraps
//    createFrameLoop (backed by the shared canvas-loop-framecapper manager),
//    useSignal/useDerived wrap the reactive primitives.
//
// No React involved: the custom runtime mounts components exactly once, so
// hooks here have no rules-of-hooks ordering constraints.
import { createFrameLoop } from '../core/frame-loop.js';
import { signal, derived } from './signal.js';
let current = null;
/** @internal Set by the reconciler around function-component invocation. */
export function setCurrentRuntime(rt) {
    const prev = current;
    current = rt;
    return prev;
}
function runtime(hook) {
    if (!current)
        throw new Error(`${hook}() may only be called inside a JSX function component while it mounts`);
    return current;
}
/** The mounting runtime: scene, renderer, loop, rng, camera accessors, … */
export function useRuntime() {
    return runtime('useRuntime');
}
/** The scene the component mounts into. */
export function useScene() {
    return runtime('useScene').scene;
}
/** The WebGL renderer driving this tree. */
export function useRenderer() {
    return runtime('useRenderer').renderer;
}
/**
 * Accessor for the active camera. Returns a getter — the camera may be
 * replaced by a <camera> element mounting later in the tree.
 */
export function useCamera() {
    const rt = runtime('useCamera');
    return () => rt.getCamera();
}
/** The frame loop driving this tree. */
export function useLoop() {
    return runtime('useLoop').loop;
}
/** The tree's seeded RNG (deterministic per render seed). */
export function useRng() {
    return runtime('useRng').rng;
}
/** Canvas size accessor: () => [width, height]. */
export function useSize() {
    const rt = runtime('useSize');
    return () => rt.getSize();
}
/** Canvas aspect-ratio accessor. */
export function useAspect() {
    const rt = runtime('useAspect');
    return () => rt.getAspect();
}
/**
 * Register a per-frame callback ({ delta, elapsed, frame }). Unsubscribes
 * automatically when the tree is disposed.
 */
export function useFrame(cb) {
    const rt = runtime('useFrame');
    const off = rt.loop.onFrame(cb);
    rt.addDisposer(off);
}
/** Register cleanup to run when the tree is disposed. */
export function useDispose(fn) {
    runtime('useDispose').addDisposer(fn);
}
/**
 * Standalone hook: a FrameLoop backed by the shared frame-capped manager.
 * Optionally registers `cb` immediately. Callable anywhere (no JSX needed).
 */
export function useFrameLoop(cb, options) {
    const loop = createFrameLoop(options);
    if (cb)
        loop.onFrame(cb);
    return loop;
}
/** Reactive state: const [count, setCount] = useSignal(0). Alias of signal(). */
export const useSignal = signal;
/** Computed reactive value derived from other accessors. Alias of derived(). */
export const useDerived = derived;
//# sourceMappingURL=hooks.js.map