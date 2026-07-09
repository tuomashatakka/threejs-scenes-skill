// lib/scaffold/orbit.ts
// Product/model-viewer scaffold: createApp with the built-in pointer orbit,
// standard lighting, an auto-rotating stage group for content, and a
// fit-to-object framing helper. Put viewer content on `stage` so the
// turntable spins the model, not the lights.

import * as THREE from 'three'

import { createApp } from '../core/app.js'
import { resolveInitialState, bindStateSource } from '../state/controller.js'
import type { App, AppOptions } from '../core/app.js'
import type { StateSource } from '../state/controller.js'
import type { Disposable } from '../types.js'


/** Options for {@link createOrbitScaffold}: `AppOptions` plus an `autoRotate` turntable speed. */
export interface OrbitScaffoldOptions<S extends object> extends Omit<AppOptions<S>, 'state'> {
  state?: StateSource<S>

  /** Turntable speed in radians/second. Default 0 (off). */
  autoRotate?: number
}

/** Handle returned by {@link createOrbitScaffold}. `dispose()` detaches the state binding, removes the stage, and disposes the app. */
export interface OrbitScaffold<S extends object> extends Disposable {
  app: App<S>

  /** Auto-rotating content root — add viewer content here. */
  stage: THREE.Group

  /** Frame an object: distance the camera so it fits with `margin` headroom. */
  fitTo (object: THREE.Object3D, margin?: number): void
}

const scratchBox    = new THREE.Box3()
const scratchSphere = new THREE.Sphere()

/**
 * Product/model-viewer scaffold: `createApp` with the built-in pointer orbit,
 * an auto-rotating `stage` group for content, and a fit-to-object framing
 * helper. Put viewer content on `stage` so the turntable spins the model,
 * not the lights.
 *
 * @param options - State source, `autoRotate` speed, and the remaining
 * `AppOptions`.
 * @returns An {@link OrbitScaffold} with the app, the `stage` group, and
 * `fitTo(object, margin)` which distances the camera so the object's bounding
 * sphere fits with `margin` headroom (default 1.25).
 * @example
 * const viewer = createOrbitScaffold({ canvas, autoRotate: 0.4 })
 * viewer.stage.add(model)
 * viewer.fitTo(model)
 * viewer.app.start()
 */
export function createOrbitScaffold<S extends object = Record<string, unknown>> ({
  state,
  autoRotate = 0,
  ...appOptions
}: OrbitScaffoldOptions<S>): OrbitScaffold<S> {
  const app = createApp<S>({
    ...appOptions,
    state: resolveInitialState(state, {} as S),
  })
  const detachState = bindStateSource(app, state)

  const stage = new THREE.Group()
  stage.name  = 'orbit-stage'
  app.ctx.scene.add(stage)

  if (autoRotate !== 0)
    app.ctx.loop.onFrame(({ delta }) => {
      stage.rotation.y += autoRotate * delta
    })

  return {
    app,
    stage,
    fitTo (object, margin = 1.25) {
      scratchBox.setFromObject(object)
      scratchBox.getBoundingSphere(scratchSphere)

      const camera = app.ctx.camera
      const fov    = (camera as THREE.PerspectiveCamera).isPerspectiveCamera
        ? THREE.MathUtils.degToRad((camera as THREE.PerspectiveCamera).fov)
        : Math.PI / 4
      const distance  = scratchSphere.radius * margin / Math.sin(fov / 2)
      const direction = camera.position.clone().sub(scratchSphere.center)
      if (direction.lengthSq() < 1e-6)
        direction.set(1, 0.6, 1)
      camera.position
        .copy(scratchSphere.center)
        .addScaledVector(direction.normalize(), distance)
      camera.lookAt(scratchSphere.center)
    },
    dispose () {
      detachState()
      app.ctx.scene.remove(stage)
      app.dispose()
    },
  }
}

// perf: cheap. the turntable is one rotation write per frame; fitTo is
// event-time only (Box3 traversal of the framed object).
