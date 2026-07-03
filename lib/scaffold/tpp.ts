// lib/scaffold/tpp.ts
// Third-person scaffold: createApp with the built-in orbit disabled and a
// framerate-independent follow camera chasing a target. Swap what is being
// chased at runtime with setTarget — drive the target's transform from your
// modules (state -> target -> camera, one direction).

import * as THREE from 'three'

import { createApp } from '../core/app.js'
import { createFollowCamera } from '../camera/follow-camera.js'
import { resolveInitialState, bindStateSource } from '../state/controller.js'
import type { App, AppOptions } from '../core/app.js'
import type { StateSource } from '../state/controller.js'
import type { Vec3Tuple } from '../camera/targets.js'
import type { Disposable, FrameContext } from '../types.js'


export interface TppScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'orbit' | 'state'> {
  state?: StateSource<S>

  /** Object to chase; can also be set later with setTarget. */
  target?: THREE.Object3D

  /** Camera offset in the target's local frame. Default [0, 3, -6]. */
  offset?: Vec3Tuple

  /** Look-at point offset ahead of the target. Default [0, 1, 4]. */
  lookAhead?:         Vec3Tuple
  stiffness?:         number
  rotationStiffness?: number
}

export interface TppScaffold<S extends object> extends Disposable {
  app: App<S>
  setTarget (target: THREE.Object3D | null): void
}

export function createTppScaffold<S extends object = Record<string, unknown>> ({
  state,
  target = undefined,
  offset = [ 0, 3, -6 ],
  lookAhead = [ 0, 1, 4 ],
  stiffness,
  rotationStiffness,
  ...appOptions
}: TppScaffoldOptions<S>): TppScaffold<S> {
  const app = createApp<S>({
    ...appOptions,
    state: resolveInitialState(state, {} as S),
    orbit: false,
  })
  const detachState = bindStateSource(app, state)

  let follow: ((ctx: FrameContext) => void) | null = null

  function setTarget (next: THREE.Object3D | null): void {
    follow = next
      ? createFollowCamera(app.ctx.camera, next, {
        offset:    new THREE.Vector3(...offset),
        lookAhead: new THREE.Vector3(...lookAhead),
        ...stiffness !== undefined ? { stiffness } : {},
        ...rotationStiffness !== undefined ? { rotationStiffness } : {},
      })
      : null
  }
  if (target)
    setTarget(target)

  app.ctx.loop.onFrame(ctx => follow?.(ctx))

  return {
    app,
    setTarget,
    dispose () {
      detachState()
      follow = null
      app.dispose()
    },
  }
}

// perf: cheap. the follow camera is three scratch vectors per frame,
// zero allocation.
