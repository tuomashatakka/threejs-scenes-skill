// lib/core/pointer-gesture.ts
// Unified pointer gesture layer. Drag, pinch, wheel, tap — works identically on
// mouse, touch, pen, stylus. Always use this instead of mouse*/touch* events.
// Ported from scripts/pointer-gesture.js.
export function attachPointerGesture(el, callbacks, { tapThresholdMs = 250, tapMovePx = 8 } = {}) {
    const pointers = new Map();
    let lastPinchDist = 0;
    let downAt = 0;
    let downX = 0;
    let downY = 0;
    // critical: disable native gesture handling on the canvas
    el.style.touchAction = 'none';
    const onDown = (e) => {
        el.setPointerCapture(e.pointerId);
        pointers.set(e.pointerId, {
            x: e.clientX,
            y: e.clientY,
            lastX: e.clientX,
            lastY: e.clientY,
        });
        if (pointers.size === 1) {
            downAt = performance.now();
            downX = e.clientX;
            downY = e.clientY;
        }
        else if (pointers.size === 2) {
            const [a, b] = [...pointers.values()];
            if (a && b)
                lastPinchDist = Math.hypot(a.x - b.x, a.y - b.y);
        }
    };
    const onMove = (e) => {
        const p = pointers.get(e.pointerId);
        if (!p)
            return;
        p.lastX = p.x;
        p.lastY = p.y;
        p.x = e.clientX;
        p.y = e.clientY;
        if (pointers.size === 1 && callbacks.onDrag)
            callbacks.onDrag(p.x - p.lastX, p.y - p.lastY, e);
        else if (pointers.size === 2 && callbacks.onPinch) {
            const [a, b] = [...pointers.values()];
            if (!a || !b)
                return;
            const dist = Math.hypot(a.x - b.x, a.y - b.y);
            const centerX = (a.x + b.x) / 2;
            const centerY = (a.y + b.y) / 2;
            if (lastPinchDist > 0)
                callbacks.onPinch(dist / lastPinchDist, centerX, centerY);
            lastPinchDist = dist;
        }
    };
    const onUp = (e) => {
        const p = pointers.get(e.pointerId);
        pointers.delete(e.pointerId);
        if (pointers.size < 2)
            lastPinchDist = 0;
        if (p && pointers.size === 0 && callbacks.onTap) {
            const dt = performance.now() - downAt;
            const moved = Math.hypot(p.x - downX, p.y - downY);
            if (dt < tapThresholdMs && moved < tapMovePx)
                callbacks.onTap(p.x, p.y, e);
        }
    };
    const onWheel = (e) => {
        if (callbacks.onWheel) {
            e.preventDefault();
            callbacks.onWheel(e.deltaY, e);
        }
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
        el.removeEventListener('pointerdown', onDown);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerup', onUp);
        el.removeEventListener('pointercancel', onUp);
        el.removeEventListener('wheel', onWheel);
    };
}
// perf: cheap. allocates one Map for active pointers; no per-frame work.
//# sourceMappingURL=pointer-gesture.js.map