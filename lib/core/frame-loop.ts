// lib/core/frame-loop.ts
// Frame loop backed by @tuomashatakka/canvas-loop-framecapper. Every animated
// subsystem registers through onFrame() and receives a shared
// { delta, elapsed, frame }. The framecapper's shared FrameLoopManager owns the
// single requestAnimationFrame and (optionally) caps it to a fixed frame rate
// with a fixed-timestep accumulator; each createFrameLoop() keeps its own
// subscriber set, frame counter and elapsed time, so independent loops can
// start/stop without affecting one another. registerUpdate/unregisterUpdate
// mirror the SceneModule lifecycle API.

import { frameLoopManager } from '@tuomashatakka/canvas-loop-framecapper'

import { createWorkerUpdateBridge } from './frame-loop-worker.js'

import type { Clock } from './clock.js'
import type { WorkerUpdateBridge } from './frame-loop-worker.js'
import type { FrameCallback, FrameLoop, WorkerUpdateFn, WorkerUpdateHandle, WorkerUpdateOptions } from '../types.js'


/** Options for {@link createFrameLoop}. */
export interface FrameLoopOptions {

  /** Injectable sim-time source (createClock). Default: raw wall-clock deltas. */
  clock?: Clock

  /**
   * Cap the loop at a fixed frame rate (fps > 0). Applies a fixed-timestep
   * accumulator: capped frames always receive delta = 1/fps. NOTE: the cap is
   * set on the shared FrameLoopManager, so it applies to every loop on the page.
   */
  fps?: number
}

/**
 * Create a frame loop that shares one `requestAnimationFrame` with every other
 * loop on the page via the framecapper's shared FrameLoopManager. Each loop
 * keeps its own subscriber set, frame counter, and elapsed time, so
 * independent loops start/stop without affecting one another; subscribing via
 * `onFrame` auto-starts the loop.
 *
 * @param options - Optional sim clock and fps cap; see {@link FrameLoopOptions}.
 * @returns A {@link FrameLoop}. `dispose()` stops the loop, clears subscribers,
 * and terminates every worker update it owns.
 * @remarks An injected `clock` sub-steps each rAF delta into simulation ticks
 * (fixed-step determinism). Worker updates registered through
 * `registerWorkerUpdate` coalesce ticks latest-wins while the worker is busy —
 * `delta` sums, `elapsed`/`frame` jump. The `fps` cap is set on the shared
 * manager, so it applies globally to every loop on the page, not just this one.
 * @see {@link FrameLoop}
 */
export function createFrameLoop ({ clock: simClock, fps }: FrameLoopOptions = {}): FrameLoop {
  const subscribers   = new Set<FrameCallback>()
  const workerBridges = new Set<WorkerUpdateBridge>()
  let frame   = 0
  let elapsed = 0
  let running = false

  if (fps !== undefined)
    frameLoopManager.setFixedFrameRate(fps)

  // One sync callback on the shared manager per loop. The manager hands us the
  // real (or fixed-step, when capped) delta in seconds; sub-stepping through an
  // injected sim clock happens here, exactly as before.
  function pump (): void {
    const real = frameLoopManager.deltaTime
    // perf: one shared rAF, one Set iteration per sim step. zero allocations.
    if (simClock) {
      for (const delta of simClock.advance(real)) {
        frame += 1

        const simElapsed = simClock.elapsed()
        for (const cb of subscribers)
          cb({ delta, elapsed: simElapsed, frame })
      }
      return
    }
    frame   += 1
    elapsed += real

    for (const cb of subscribers)
      cb({ delta: real, elapsed, frame })
  }

  function start (): void {
    if (running)
      return
    running = true
    frameLoopManager.registerSyncCallback(pump)
    frameLoopManager.resume()
  }

  function stop (): void {
    if (!running)
      return
    running = false
    // Unregister only — pausing the shared manager would freeze sibling loops.
    frameLoopManager.unregisterSyncCallback(pump)
  }

  function onFrame (cb: FrameCallback): () => void {
    subscribers.add(cb)
    if (!running)
      start()
    return () => {
      subscribers.delete(cb)
    }
  }

  function registerUpdate (cb: FrameCallback): () => void {
    return onFrame(cb)
  }

  function unregisterUpdate (cb: FrameCallback): void {
    subscribers.delete(cb)
  }

  function registerWorkerUpdate<S = unknown> (fn: WorkerUpdateFn<S>, options?: WorkerUpdateOptions<S>): WorkerUpdateHandle {
    const bridge = createWorkerUpdateBridge(fn, options)
    workerBridges.add(bridge)

    const off = onFrame(ctx => bridge.tick(ctx))
    return {
      unregister: off,
      terminate (): void {
        off()
        bridge.terminate()
        workerBridges.delete(bridge)
      },
    }
  }

  function dispose (): void {
    stop()
    subscribers.clear()
    for (const bridge of workerBridges)
      bridge.terminate()
    workerBridges.clear()
    frame   = 0
    elapsed = 0
  }

  return { onFrame, registerUpdate, unregisterUpdate, registerWorkerUpdate, start, stop, dispose }
}
