// lib/core/frame-loop-worker.ts
// Off-thread frame updates for createFrameLoop().registerWorkerUpdate. The
// handler is serialized (Function.prototype.toString) into an inline blob-URL
// module worker — nothing extra ships in the package and both the compiled
// dist/*.js and raw lib/*.ts entry styles work unchanged. When workers are
// unavailable (CSP without worker-src blob:, non-browser runtimes) the bridge
// degrades to same-thread microtask scheduling with identical semantics.

import type { FrameContext, WorkerUpdateFn, WorkerUpdateOptions } from '../types.js'


interface PendingTick {
  delta:   number
  elapsed: number
  frame:   number
}

/** Internal transport behind a worker update: one `tick` sink + teardown. */
export interface WorkerUpdateBridge {
  tick (ctx: FrameContext): void
  terminate (): void
}

/** Test seam: `forceFallback` skips Worker construction (used by the smoke test). */
export interface WorkerBridgeInternals {
  forceFallback?: boolean
}

// The worker body. The handler source is interpolated as a plain expression —
// no eval/new Function, so pages only need `worker-src blob:`, not
// 'unsafe-eval'. Messages: {type:'init', state} seeds state; {type:'tick', ctx}
// runs the handler and answers {type:'result'|'error'} (an error reply still
// counts as tick completion on the main thread).
function workerBootstrap (fnSource: string): string {
  return `
const handler = (${fnSource});
let state;
self.onmessage = (event) => {
  const msg = event.data;
  if (msg.type === 'init') {
    state = msg.state;
    return;
  }
  if (msg.type !== 'tick')
    return;
  try {
    const next = handler(msg.ctx, state);
    if (next !== undefined)
      state = next;
    self.postMessage({ type: 'result', frame: msg.ctx.frame, state });
  }
  catch (err) {
    self.postMessage({
      type: 'error',
      frame: msg.ctx.frame,
      message: String(err && err.message || err),
      stack: err && err.stack || '',
    });
  }
};
`
}

function assertSerializable (fn: (...args: never[]) => unknown): string {
  const source = fn.toString()
  if (source.includes('[native code]'))
    throw new Error('registerWorkerUpdate: handler is a native or bound function and cannot be serialized — pass a plain, self-contained function expression')
  // Method shorthand ("tick(ctx, s) {…}") is not a valid standalone expression.
  if (!(/^\s*(?:async\s+)?(?:function\b|\()/).test(source) && !(/^\s*(?:async\s+)?[\w$]+\s*=>/).test(source))
    throw new Error('registerWorkerUpdate: handler must be a function expression or arrow function (object method shorthand does not serialize) — it is rehydrated inside a worker and must be self-contained')
  return source
}

let warnedFallback = false

/**
 * Wire a serialized handler to a dedicated worker (or the microtask fallback).
 * One bridge per registered update; `createFrameLoop` owns the lifecycle.
 */
export function createWorkerUpdateBridge<S> (
  fn: WorkerUpdateFn<S>,
  options: WorkerUpdateOptions<S> = {},
  internals: WorkerBridgeInternals = {},
): WorkerUpdateBridge {
  const source  = assertSerializable(fn)
  const onError = options.onError ?? ((error: Error) => {
    console.error('registerWorkerUpdate:', error)
  })

  let inFlight                    = false
  let pending: PendingTick | null = null
  let terminated                  = false

  // --- worker path -------------------------------------------------------
  let worker: Worker | null = null
  let blobUrl               = ''
  let urlRevoked            = false

  const revokeUrl = (): void => {
    // Revoking at construction can race the module-worker fetch; defer to the
    // first message (or terminate).
    if (!urlRevoked && blobUrl) {
      urlRevoked = true
      URL.revokeObjectURL(blobUrl)
    }
  }

  if (!internals.forceFallback && typeof Worker !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function')
    try {
      blobUrl = URL.createObjectURL(new Blob([ workerBootstrap(source) ], { type: 'text/javascript' }))
      worker = new Worker(blobUrl, { type: 'module' })
      worker.postMessage({ type: 'init', state: options.initialState })
      worker.onmessage = (event: MessageEvent) => {
        revokeUrl()

        const msg = event.data
        inFlight = false
        if (msg?.type === 'result')
          options.onResult?.(msg.state as S)
        else if (msg?.type === 'error')
          onError(new Error(`worker update handler threw: ${msg.message}${msg.stack ? `\n${msg.stack}` : ''}`))
        flushPending()
      }
      worker.onerror = (event: ErrorEvent) => {
        revokeUrl()
        inFlight = false
        onError(new Error(`worker update failed: ${event.message || 'unknown worker error'}`))
      }
      worker.onmessageerror = () => {
        inFlight = false
        onError(new Error('worker update: message could not be deserialized'))
      }
    }
    catch (err) {
      revokeUrl()
      worker = null
      if (!warnedFallback) {
        warnedFallback = true
        console.warn('registerWorkerUpdate: Worker construction failed, falling back to same-thread microtasks', err)
      }
    }

  // --- fallback path ------------------------------------------------------
  // Same-thread, microtask-deferred, identical in-flight/coalesce semantics.
  let fallbackState = options.initialState as S

  function runFallback (ctx: PendingTick): void {
    queueMicrotask(() => {
      if (terminated)
        return
      try {
        const next = fn(ctx, fallbackState)
        if (next !== undefined)
          fallbackState = next
        inFlight = false
        options.onResult?.(fallbackState)
      }
      catch (err) {
        inFlight = false
        onError(err instanceof Error ? err : new Error(String(err)))
      }
      flushPending()
    })
  }

  // --- shared pump --------------------------------------------------------
  function post (ctx: PendingTick): void {
    inFlight = true
    if (worker)
      try {
        worker.postMessage({ type: 'tick', ctx })
      }
      catch (err) {
        // DataCloneError etc. must reach onError, not escape into the rAF.
        inFlight = false
        onError(err instanceof Error ? err : new Error(String(err)))
      }
    else
      runFallback(ctx)
  }

  function flushPending (): void {
    if (terminated || inFlight || !pending)
      return

    const next = pending
    pending = null
    post(next)
  }

  return {
    tick (ctx: FrameContext): void {
      if (terminated)
        return
      if (inFlight) {
        // Latest-wins: deltas sum so simulated time never drops.
        pending = {
          delta:   (pending?.delta ?? 0) + ctx.delta,
          elapsed: ctx.elapsed,
          frame:   ctx.frame,
        }
        return
      }
      post({ delta: ctx.delta, elapsed: ctx.elapsed, frame: ctx.frame })
    },

    terminate (): void {
      if (terminated)
        return
      terminated = true
      pending = null
      inFlight = false
      revokeUrl()
      worker?.terminate()
      worker = null
    },
  }
}
