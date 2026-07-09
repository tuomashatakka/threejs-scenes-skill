// lib/props/prop.ts
// Prop factory. A "prop" bundles an Object3D with optional animation clips,
// embedded light sources, and an instancing hint behind one declarative
// definition. defineProp authors it; createProp mounts a live PropInstance —
// building the object, parenting its lights, wiring an AnimationController
// (auto-played, looping) onto ctx.loop, and exposing a single dispose().

import * as THREE from 'three'

import { createAnimationController } from '../animation/mixer.js'
import { disposeScene } from '../core/dispose.js'
import type { PropContext, PropDefinition, PropFactory, PropInstance } from '../types.js'


/** Validate + tag a prop definition. The returned factory is what <Prop src> resolves to. */
export function defineProp (def: PropDefinition): PropFactory {
  if (!def.name)
    throw new Error('defineProp: a `name` is required')
  return def
}

/** Mount options for {@link createProp}. */
export interface CreatePropOptions {

  /** Auto-play every clip on mount (looping). Default true. */
  autoplay?: boolean
}

/**
 * Mount a prop definition: build its object, attach declared lights, and wire
 * declared clips into an `AnimationController` (auto-playing looped by
 * default).
 *
 * @param factory - The prop definition (author with `defineProp`).
 * @param ctx - Prop context; pass `loop` so clips advance with the frame loop.
 * @param options - Set `autoplay: false` to leave clips stopped.
 * @returns A `PropInstance`; `dispose()` frees the controller and everything
 * the prop built.
 */
export function createProp (factory: PropFactory, ctx: PropContext = {}, options: CreatePropOptions = {}): PropInstance {
  const { autoplay = true } = options
  const object              = factory.build(ctx)

  const lights = factory.lights?.(object) ?? []
  for (const light of lights)
    object.add(light)

  const clips = factory.clips?.(object) ?? []
  let controller: PropInstance['controller']
  if (clips.length) {
    controller = createAnimationController(object, clips, ctx.loop)
    if (autoplay)
      for (const clip of clips)
        controller.play(clip.name, { loop: THREE.LoopRepeat })
  }

  function dispose (): void {
    controller?.dispose()
    for (const light of lights) {
      light.parent?.remove(light)
      light.dispose()
    }
    disposeScene(object)
  }

  return { object, controller, lights, dispose }
}

// perf: one prop = one (or few) draw calls unless instanced. The controller tick
// is registered once on the loop; dispose unregisters it and frees GPU memory.
