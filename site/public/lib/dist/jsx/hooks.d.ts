import type * as THREE from 'three';
import type { FrameLoopOptions } from '../core/frame-loop.js';
import { signal, derived } from './signal.js';
import type { Runtime } from './components.js';
import type { FrameCallback, FrameLoop, SeededRng } from '../types.js';
/** @internal Set by the reconciler around function-component invocation. */
export declare function setCurrentRuntime(rt: Runtime | null): Runtime | null;
/** The mounting runtime: scene, renderer, loop, rng, camera accessors, … */
export declare function useRuntime(): Runtime;
/** The scene the component mounts into. */
export declare function useScene(): THREE.Scene;
/** The WebGL renderer driving this tree. */
export declare function useRenderer(): THREE.WebGLRenderer;
/**
 * Accessor for the active camera. Returns a getter — the camera may be
 * replaced by a <camera> element mounting later in the tree.
 */
export declare function useCamera(): () => THREE.Camera;
/** The frame loop driving this tree. */
export declare function useLoop(): FrameLoop;
/** The tree's seeded RNG (deterministic per render seed). */
export declare function useRng(): SeededRng;
/** Canvas size accessor: () => [width, height]. */
export declare function useSize(): () => [number, number];
/** Canvas aspect-ratio accessor. */
export declare function useAspect(): () => number;
/**
 * Register a per-frame callback ({ delta, elapsed, frame }). Unsubscribes
 * automatically when the tree is disposed.
 */
export declare function useFrame(cb: FrameCallback): void;
/** Register cleanup to run when the tree is disposed. */
export declare function useDispose(fn: () => void): void;
/**
 * Standalone hook: a FrameLoop backed by the shared frame-capped manager.
 * Optionally registers `cb` immediately. Callable anywhere (no JSX needed).
 */
export declare function useFrameLoop(cb?: FrameCallback, options?: FrameLoopOptions): FrameLoop;
/** Reactive state: const [count, setCount] = useSignal(0). Alias of signal(). */
export declare const useSignal: typeof signal;
/** Computed reactive value derived from other accessors. Alias of derived(). */
export declare const useDerived: typeof derived;
//# sourceMappingURL=hooks.d.ts.map