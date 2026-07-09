// lib/scaffold/iso.ts
// Isometric-scene scaffold: one call wires createApp with an orthographic iso
// camera, drag-to-pan in the ground plane, pinch/wheel zoom (frustum resize,
// not dolly), and an optional recentering infinite ground. Accepts a plain
// object, a store, or any { get, subscribe } controller as its state source.

import * as THREE from 'three'

import { createApp } from '../core/app.js'
import { attachPointerGesture } from '../core/pointer-gesture.js'
import { createIsoCamera, resizeIsoCamera } from '../camera/iso-camera.js'
import { createInfiniteGround } from '../geometry/infinite-ground.js'
import { resolveInitialState, bindStateSource } from '../state/controller.js'
import type { App, AppOptions } from '../core/app.js'
import type { IsoCameraOptions } from '../camera/iso-camera.js'
import type { InfiniteGround, InfiniteGroundOptions } from '../geometry/infinite-ground.js'
import type { StateSource } from '../state/controller.js'
import type { Disposable } from '../types.js'


/** Options for {@link createIsoScaffold}: `AppOptions` minus camera/orbit/state, plus the iso camera settings and pan/zoom/ground wiring. */
export interface IsoScaffoldOptions<S extends object>
  extends Omit<AppOptions<S>, 'camera' | 'orbit' | 'state'>, IsoCameraOptions {

  /** Plain object, store, or controller — external controllers stay bound. */
  state?: StateSource<S>

  /** Drag panning in the ground plane. Default true. */
  pan?: boolean

  /** viewSize clamp for pinch/wheel zoom. Default [6, 80]; false disables zoom. */
  zoom?: readonly [number, number] | false

  /** Recentering tiled terrain following the pan focus. Off by default. */
  ground?: InfiniteGroundOptions
}

/** Handle returned by {@link createIsoScaffold}. `dispose()` detaches gestures and the state binding, removes and disposes the ground, then disposes the app. */
export interface IsoScaffold<S extends object> extends Disposable {
  app:    App<S>
  camera: THREE.OrthographicCamera

  /** The pan focus in the ground plane — tiles recenter around it. */
  focus:  THREE.Vector3
  ground: InfiniteGround | null
}

/**
 * Isometric-scene scaffold in one call: `createApp` with an orthographic iso
 * camera, drag-to-pan in the ground plane, pinch/wheel zoom via frustum
 * resize (not dolly), and an optional recentering infinite ground.
 *
 * @param options - State source, iso camera flavor, pan/zoom/ground settings,
 * and the remaining `AppOptions`.
 * @returns An {@link IsoScaffold} exposing the app, camera, pan `focus`, and
 * ground handle.
 * @remarks Pan and zoom are event-driven; the ground recenter costs only the
 * tiles that crossed a cell boundary per frame. Zoom clamps `viewSize` to the
 * `zoom` range.
 * @example
 * const iso = createIsoScaffold({ canvas, state: store, ground: { tile: 8 } })
 * iso.app.start()
 */
export function createIsoScaffold<S extends object = Record<string, unknown>> ({
  state,
  viewSize = 20,
  flavor = 'dimetric',
  near,
  far,
  pan = true,
  zoom = [ 6, 80 ],
  ground: groundOptions,
  ...appOptions
}: IsoScaffoldOptions<S>): IsoScaffold<S> {
  const { canvas } = appOptions
  const aspect     = canvas.clientWidth / canvas.clientHeight || 1
  const camera     = createIsoCamera(aspect, { viewSize, flavor, near, far })

  const app = createApp<S>({
    ...appOptions,
    state:    resolveInitialState(state, {} as S),
    camera,
    orbit:    false,
    onResize: (width, height) => resizeIsoCamera(camera, width / height || 1),
  })
  const detachState = bindStateSource(app, state)

  // pan basis: camera right, and camera up flattened onto the ground plane —
  // dragging up moves the focus away from the viewer, like every iso builder.
  const right   = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0)
  const forward = new THREE.Vector3()
    .setFromMatrixColumn(camera.matrix, 1)
    .setY(0)
    .normalize()
  const focus  = new THREE.Vector3()
  const offset = camera.position.clone()

  let detachGesture: (() => void) | null = null
  if (pan || zoom) {
    const applyZoom = (nextViewSize: number): void => {
      if (!zoom)
        return
      camera.userData.viewSize = Math.max(zoom[0], Math.min(zoom[1], nextViewSize))
      resizeIsoCamera(camera, canvas.clientWidth / canvas.clientHeight || 1)
    }
    detachGesture = attachPointerGesture(canvas, {
      onDrag (dx, dy) {
        if (!pan)
          return

        const worldPerPixel = (camera.userData.viewSize as number) / (canvas.clientHeight || 1)
        focus.addScaledVector(right, -dx * worldPerPixel)
        focus.addScaledVector(forward, dy * worldPerPixel)
        camera.position.copy(focus).add(offset)
      },
      onPinch (deltaScale) {
        applyZoom((camera.userData.viewSize as number) / deltaScale)
      },
      onWheel (delta) {
        applyZoom((camera.userData.viewSize as number) * (1 + delta * 0.001))
      },
    })
  }

  let ground: InfiniteGround | null = null
  if (groundOptions) {
    ground = createInfiniteGround(groundOptions)
    app.ctx.scene.add(ground.object)
    app.ctx.loop.onFrame(() => ground!.update(focus))
    ground.update(focus)
  }

  return {
    app,
    camera,
    focus,
    ground,
    dispose () {
      detachGesture?.()
      detachState()
      if (ground) {
        app.ctx.scene.remove(ground.object)
        ground.dispose()
      }
      app.dispose()
    },
  }
}

// perf: cheap on top of createApp — pan/zoom are event-driven; the ground
// recenter is O(tiles that crossed a cell boundary) per frame, usually zero.
