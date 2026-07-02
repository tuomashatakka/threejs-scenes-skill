import { useCallback as n, useEffect as l, useSyncExternalStore as m } from "react";
class o {
  constructor() {
    this._syncCallbacks = /* @__PURE__ */ new Set(), this._asyncCallbacks = /* @__PURE__ */ new Set(), this._listeners = /* @__PURE__ */ new Set(), this._animationFrameId = null, this._lastFrameTime = performance.now(), this._elapsedTimeAccumulator = 0, this.totalTime = 0, this.deltaTime = 0, this.isPaused = !0, this._fixedFrameRate = 0, this._msPerFrame = 0, this._loop = this._loop.bind(this);
  }
  setFixedFrameRate(e) {
    this._fixedFrameRate = e, this._msPerFrame = e > 0 ? 1e3 / e : 0, this._notify();
  }
  getFramerate() {
    return this._fixedFrameRate;
  }
  registerSyncCallback(e) {
    this._syncCallbacks.add(e), this._manageLoop();
  }
  unregisterSyncCallback(e) {
    this._syncCallbacks.delete(e), this._manageLoop();
  }
  registerAsyncCallback(e) {
    this._asyncCallbacks.add(e), this._manageLoop();
  }
  unregisterAsyncCallback(e) {
    this._asyncCallbacks.delete(e), this._manageLoop();
  }
  resume() {
    this.isPaused && (this.isPaused = !1, this._lastFrameTime = performance.now(), this._notify());
  }
  pause() {
    this.isPaused || (this.isPaused = !0, this._notify());
  }
  reset() {
    this.totalTime = 0, this.deltaTime = 0, this.isPaused = !0, this._elapsedTimeAccumulator = 0, this._lastFrameTime = performance.now(), this._notify();
  }
  subscribe(e) {
    return this._listeners.add(e), () => this._listeners.delete(e);
  }
  _notify() {
    this._listeners.forEach((e) => e());
  }
  _manageLoop() {
    const e = this._syncCallbacks.size > 0 || this._asyncCallbacks.size > 0;
    e && this._animationFrameId === null ? this._start() : !e && this._animationFrameId !== null && this._stop();
  }
  _start() {
    this._animationFrameId === null && (this._lastFrameTime = performance.now(), this._animationFrameId = requestAnimationFrame(this._loop));
  }
  _stop() {
    this._animationFrameId !== null && (cancelAnimationFrame(this._animationFrameId), this._animationFrameId = null);
  }
  _loop(e) {
    if (this._animationFrameId = requestAnimationFrame(this._loop), this.isPaused)
      return;
    const i = e - this._lastFrameTime;
    if (this._lastFrameTime = e, this._elapsedTimeAccumulator += i, this._msPerFrame > 0 && this._elapsedTimeAccumulator < this._msPerFrame)
      return;
    let r = i;
    this._msPerFrame > 0 && (r = this._msPerFrame, this._elapsedTimeAccumulator -= this._msPerFrame), this.deltaTime = r / 1e3, this.totalTime += this.deltaTime, this._syncCallbacks.forEach((a) => a(this)), this._asyncCallbacks.forEach((a) => Promise.resolve().then(() => a(this)));
  }
}
const s = new o(), c = (t) => {
  const e = n(t, [t]);
  l(() => (s.registerAsyncCallback(e), () => {
    s.unregisterAsyncCallback(e);
  }), [e]);
}, _ = () => (m(
  s.subscribe.bind(s),
  // We track a combined string of state, so the component re-renders if any part changes.
  () => `${s.isPaused}:${s.getFramerate()}`
), s);
export {
  s as frameLoopManager,
  c as useFrameLoop,
  _ as useFrameLoopManager
};
