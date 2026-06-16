// lib/core/frame-loop.ts
// Self-contained Clock-driven frame loop. Single source of truth: every
// animated subsystem registers through onFrame() and receives a shared
// { delta, elapsed, frame }. Ported from scripts/frame-loop.js but with the
// external @tuomashatakka/canvas-loop-framecapper dependency removed — the loop
// is inlined the same way the templates inline it, so the package has no exotic
// deps. registerUpdate/unregisterUpdate mirror the SceneModule lifecycle API.

import * as THREE from 'three'

import type { FrameCallback, FrameLoop } from '../types.js'


export function createFrameLoop (): FrameLoop {
  const subscribers = new Set<FrameCallback>()
  const clock       = new THREE.Clock(false)
  let frame   = 0
  let rafId   = 0
  let running = false

  function tick (): void {
    if (!running)
      return
    rafId = requestAnimationFrame(tick)
    frame += 1

    const delta   = clock.getDelta()
    const elapsed = clock.getElapsedTime()
    // perf: one rAF, one Set iteration per frame. zero allocations.
    for (const cb of subscribers)
      cb({ delta, elapsed, frame })
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
