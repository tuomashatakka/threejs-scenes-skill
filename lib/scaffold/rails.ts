// lib/scaffold/rails.ts
// On-rails scaffold: an endless segment stream stitched into one curve and a
// path camera travelling it with pointer look-around. You supply a segment
// factory (seeded rng in hand); the scaffold appends segments ahead of the
// camera and evicts them behind it — constant memory, infinite ride.

import { createApp } from '../core/app.js'
import { createPathCamera } from '../camera/path-camera.js'
import { createSegmentStream } from '../procedural/segment-stream.js'
import { resolveInitialState, bindStateSource } from '../state/controller.js'
import type * as THREE from 'three'
import type { App, AppOptions } from '../core/app.js'
import type { PathCamera, PathCameraOptions } from '../camera/path-camera.js'
import type { SegmentStream, SegmentStreamOptions, StreamSegmentInput } from '../procedural/segment-stream.js'
import type { StateSource } from '../state/controller.js'
import type { SeededRng, Disposable } from '../types.js'


/** Options for {@link createRailsScaffold}: `AppOptions` minus orbit/state, plus segment-stream and path-camera tuning and the `segment` factory. */
export interface RailsScaffoldOptions<S extends object>
  extends Omit<AppOptions<S>, 'orbit' | 'state'>, SegmentStreamOptions, PathCameraOptions {
  state?: StateSource<S>

  /** Build segment #index. Runs ahead of the camera; keep it deterministic via rng. */
  segment: (index: number, rng: SeededRng) => StreamSegmentInput

  /** Append the next segment when less than this path length remains. Default 40. */
  prefetchDistance?: number
}

/** Handle returned by {@link createRailsScaffold}. `dispose()` detaches state, then disposes the camera rig, the stream, and the app. */
export interface RailsScaffold<S extends object> extends Disposable {
  app:    App<S>
  stream: SegmentStream
  rig:    PathCamera
}

/**
 * On-rails scaffold: an endless segment stream stitched into one curve and a
 * path camera travelling it with pointer look-around. You supply a `segment`
 * factory (seeded rng in hand); the scaffold appends segments ahead of the
 * camera and evicts them behind it — constant memory, infinite ride.
 *
 * @param options - State source, the deterministic `segment` builder,
 * `prefetchDistance`, plus segment-stream and path-camera tuning.
 * @returns A {@link RailsScaffold} with the app, the segment `stream`, and
 * the path-camera `rig`.
 * @remarks Per frame this costs two curve samples and a length check; segment
 * builds amortize over the ride and evicted segments dispose their own GPU
 * memory. A degenerate zero-length segment is guarded against (16 appends max
 * per prefetch pass).
 * @example
 * const ride = createRailsScaffold({ canvas, segment: (i, rng) => tunnelSegment(rng) })
 * ride.app.start()
 */
export function createRailsScaffold<S extends object = Record<string, unknown>> ({
  state,
  segment,
  prefetchDistance = 40,
  maxActive,
  lift,
  tension,
  yawRange,
  pitchRange,
  smoothing,
  speed,
  ...appOptions
}: RailsScaffoldOptions<S>): RailsScaffold<S> {
  const app = createApp<S>({
    ...appOptions,
    state: resolveInitialState(state, {} as S),
    orbit: false,
  })
  const detachState = bindStateSource(app, state)

  const stream = createSegmentStream(app.ctx.scene, { maxActive, lift, tension })
  const rig    = createPathCamera(
    app.ctx.camera as THREE.PerspectiveCamera,
    stream,
    appOptions.canvas,
    { yawRange, pitchRange, smoothing, speed },
  )
  const segmentRng = app.ctx.rng.fork('rails-segments')

  function prefetch (): void {
    // safety cap: a degenerate zero-length segment must not spin forever
    for (let guard = 0; guard < 16 && stream.total - rig.distance < prefetchDistance; guard++)
      stream.append(segment(stream.appended, segmentRng))
  }
  prefetch()

  app.ctx.loop.onFrame(ctx => {
    rig.update(ctx)
    prefetch()
  })

  return {
    app,
    stream,
    rig,
    dispose () {
      detachState()
      rig.dispose()
      stream.dispose()
      app.dispose()
    },
  }
}

// perf: cheap per frame (two curve samples + a length check); segment builds
// amortize over the ride and evicted segments dispose their own GPU memory.
