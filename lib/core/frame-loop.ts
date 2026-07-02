// lib/core/frame-loop.ts
// Self-contained Clock-driven frame loop. Single source of truth: every
// animated subsystem registers through onFrame() and receives a shared
// { delta, elapsed, frame }. Ported from scripts/frame-loop.js but with the
// external @tuomashatakka/canvas-loop-framecapper dependency removed — the loop
// is inlined the same way the templates inline it, so the package has no exotic
// deps. registerUpdate/unregisterUpdate mirror the SceneModule lifecycle API.

import * as THREE from 'three'

import type { Clock } from './clock.js'
import type { FrameCallback, FrameLoop } from '../types.js'


export interface FrameLoopOptions {

  /** Injectable sim-time source (createClock). Default: raw wall-clock deltas. */
  clock?: Clock
}

export function createFrameLoop ({ clock: simClock }: FrameLoopOptions = {}): FrameLoop {
  const subscribers = new Set<FrameCallback>()
  const clock       = new THREE.Clock(false)
  let frame   = 0
  let rafId   = 0
  let running = false

  function tick (): void {
    if (!running)
      return
    rafId = requestAnimationFrame(tick)

    const real = clock.getDelta()
    // perf: one rAF, one Set iteration per sim step. zero allocations.
    if (simClock) {
      for (const delta of simClock.advance(real)) {
        frame += 1

        const elapsed = simClock.elapsed()
        for (const cb of subscribers)
          cb({ delta, elapsed, frame })
      }
      return
    }
    frame += 1

    const elapsed = clock.getElapsedTime()
    for (const cb of subscribers)
      cb({ delta: real, elapsed, frame })
  }

  function start (): void {
    if (running)
      return
    running = true
    clock.start()
    rafId = requestAnimationFrame(tick)
  }

  function stop (): void {
    if (!running)
      return
    running = false
    clock.stop()
    cancelAnimationFrame(rafId)
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

  function dispose (): void {
    stop()
    subscribers.clear()
    frame = 0
  }

  return { onFrame, registerUpdate, unregisterUpdate, start, stop, dispose }
}
