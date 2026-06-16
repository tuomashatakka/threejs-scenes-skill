// scripts/frame-loop.js
// Three.js render-loop adapter for @tuomashatakka/canvas-loop-framecapper.
// Single source of truth for the frame loop. Every animated subsystem registers
// through onFrame() and receives { delta, elapsed, frame }.

import { frameLoopManager } from '@tuomashatakka/canvas-loop-framecapper'


const subscribers = new Set()
let frame        = 0
let bootstrapped = false

function onTick (manager) {
  frame += 1

  const ctx = {
    delta:   manager.deltaTime,
    elapsed: manager.totalTime,
    frame,
  }
  for (const cb of subscribers)
    cb(ctx)
}

function ensureLoop () {
  if (bootstrapped)
    return
  frameLoopManager.registerSyncCallback(onTick)
  frameLoopManager.resume()
  bootstrapped = true
}

export function onFrame (cb) {
  ensureLoop()
  subscribers.add(cb)
  return () => subscribers.delete(cb)
}

export function startRenderLoop ({ renderer, scene, camera, fpsCap = 0, render }) {
  if (fpsCap > 0)
    frameLoopManager.setFixedFrameRate(fpsCap)
  return onFrame(ctx => {
    if (render)
      render(ctx)
    else
      renderer.render(scene, camera)
  })
}

export function pauseLoop () {
  frameLoopManager.pause()
}
export function resumeLoop () {
  frameLoopManager.resume()
}
export function resetLoop () {
  frameLoopManager.reset(); frame = 0
}

export function setFpsCap (fps) {
  frameLoopManager.setFixedFrameRate(fps)
}

// perf: cheap. one rAF, one Set iteration per frame. zero allocations.
