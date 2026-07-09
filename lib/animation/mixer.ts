// lib/animation/mixer.ts
// AnimationMixer convenience layer. createAnimationController wraps a mixer +
// its actions with play/crossfade/stop and a tick(ctx) that advances by
// ctx.delta. Pass a FrameLoop and it auto-registers the tick — wiring imported
// .glb animations or programmatic clips (./clips) into the render loop in one
// call. dispose() unregisters + uncaches so nothing leaks.

import * as THREE from 'three'

import type { AnimationController, FrameContext, FrameLoop, PlayOptions } from '../types.js'


/**
 * Wrap an `AnimationMixer` and its actions with `play`/`crossfade`/`stop` and
 * a `tick(ctx)` that advances by `ctx.delta`. Pass a `FrameLoop` to
 * auto-register the tick so playback follows the render loop.
 *
 * @param root - Object the mixer binds to (the .glb scene or a procedural prop).
 * @param clips - Clips to expose as named actions.
 * @param loop - When given, `tick` auto-registers via `registerUpdate`.
 * @returns An `AnimationController`. `dispose()` unregisters the tick, stops
 * all actions, and uncaches the root so nothing leaks.
 * @remarks One mixer per animated root; cost scales with active tracks.
 * Crossfades blend on the CPU.
 * @example
 * const anim = createAnimationController(model.scene, model.animations, ctx.loop)
 * anim.play('walk', { fadeIn: 0.3 })
 */
export function createAnimationController (
  root: THREE.Object3D,
  clips: THREE.AnimationClip[] = [],
  loop?: FrameLoop,
): AnimationController {
  const mixer   = new THREE.AnimationMixer(root)
  const actions = new Map<string, THREE.AnimationAction>()

  for (const clip of clips)
    actions.set(clip.name, mixer.clipAction(clip))

  function play (name: string, options: PlayOptions = {}): THREE.AnimationAction | null {
    const action = actions.get(name)
    if (!action)
      return null
    if (options.reset)
      action.reset()
    if (options.loop !== undefined)
      action.setLoop(options.loop, Infinity)
    if (options.clampWhenFinished !== undefined)
      action.clampWhenFinished = options.clampWhenFinished
    if (options.timeScale !== undefined)
      action.setEffectiveTimeScale(options.timeScale)
    if (options.fadeIn)
      action.fadeIn(options.fadeIn)
    action.play()
    return action
  }

  function crossfade (from: string, to: string, duration = 0.4): void {
    const a = actions.get(from)
    const b = actions.get(to)
    if (!b)
      return
    b.reset().play()
    if (a)
      a.crossFadeTo(b, duration, false)
    else
      b.fadeIn(duration)
  }

  function stop (name?: string): void {
    if (name)
      actions.get(name)?.stop()
    else
      mixer.stopAllAction()
  }

  function tick (ctx: FrameContext): void {
    mixer.update(ctx.delta)
  }

  const unregister = loop ? loop.registerUpdate(tick) : null

  function dispose (): void {
    unregister?.()
    mixer.stopAllAction()
    mixer.uncacheRoot(root)
    actions.clear()
  }

  return { mixer, actions, play, crossfade, stop, tick, dispose }
}

// perf: one mixer per animated root. mixer.update is cheap; the cost scales with
// active tracks. Crossfades blend on the CPU and free the faded-out action.
