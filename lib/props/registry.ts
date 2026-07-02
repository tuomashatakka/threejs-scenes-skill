// lib/props/registry.ts
// Prop resolution. resolveProp turns a <Prop src> value into a live PropInstance,
// dispatching across three source kinds:
//   1. a PropFactory object        -> createProp (sync, wrapped in a resolved promise)
//   2. a registered name           -> createProp from the registry
//   3. a model file (.glb/.gltf)   -> loadModel, wrap scene + animations
//   4. otherwise a module path     -> dynamic import(), use its prop export
// Everything returns a Promise<PropInstance> so callers have one code path.

import * as THREE from 'three'

import { createProp } from './prop.js'
import { loadModel } from '../loaders/model-registry.js'
import { createAnimationController } from '../animation/mixer.js'
import { disposeScene } from '../core/dispose.js'
import type { PropContext, PropFactory, PropInstance } from '../types.js'


// An explicit, owned prop registry — prefer this over the module-global one
// so name resolution is scoped to your app (unidirectional-API form).
export interface PropRegistry {
  register (name: string, factory: PropFactory): void
  get (name: string): PropFactory | undefined
  resolve (src: PropFactory | string, ctx?: PropContext): Promise<PropInstance>
}

export function createPropRegistry (): PropRegistry {
  const names = new Map<string, PropFactory>()
  return {
    register (name, factory) {
      names.set(name, factory)
    },
    get: name => names.get(name),
    resolve (src, ctx = {}) {
      return resolveWith(names, src, ctx)
    },
  }
}

// module-global convenience instance, kept for back-compat.
const registry = new Map<string, PropFactory>()

export function registerProp (name: string, factory: PropFactory): void {
  registry.set(name, factory)
}

export function getProp (name: string): PropFactory | undefined {
  return registry.get(name)
}

function isFactory (value: unknown): value is PropFactory {
  return typeof value === 'object' && value !== null && typeof (value as PropFactory).build === 'function'
}

function isModelFile (src: string): boolean {
  return (/\.(glb|gltf)(\?|#|$)/i).test(src)
}

function wrapModel (object: THREE.Object3D, clips: THREE.AnimationClip[], ctx: PropContext): PropInstance {
  let controller: PropInstance['controller']
  if (clips.length) {
    controller = createAnimationController(object, clips, ctx.loop)
    for (const clip of clips)
      controller.play(clip.name, { loop: THREE.LoopRepeat })
  }
  return {
    object,
    controller,
    lights: [],
    dispose () {
      controller?.dispose()
      disposeScene(object)
    },
  }
}

export function resolveProp (
  src: PropFactory | string,
  ctx: PropContext = {},
): Promise<PropInstance> {
  return resolveWith(registry, src, ctx)
}

async function resolveWith (
  names: Map<string, PropFactory>,
  src: PropFactory | string,
  ctx: PropContext,
): Promise<PropInstance> {
  if (isFactory(src))
    return createProp(src, ctx)

  const registered = names.get(src)
  if (registered)
    return createProp(registered, ctx)

  if (isModelFile(src)) {
    const model = await loadModel(src)
    return wrapModel(model.scene, model.animations, ctx)
  }

  // module path — expect a default or `prop` export that is a PropFactory.
  const mod     = await import(/* @vite-ignore */ src) as Record<string, unknown>
  const factory = (mod.default ?? mod.prop) as PropFactory | undefined
  if (!isFactory(factory))
    throw new Error(`resolveProp: ${src} has no default/prop PropFactory export`)
  return createProp(factory, ctx)
}

// perf: registry + model cache (loaders) dedupe repeats. Dynamic import is one
// network/module fetch the first time, then cached by the runtime.
