// lib/compose/scene-events.ts
// Declarative pointer-event -> raycast binding: register scene objects with
// handlers and get tap / down / up / enter / leave callbacks with the hit
// intersection, instead of hand-rolling a raycaster per app. Uses pointer*
// events exclusively and the click-vs-drag guard from architecture/pick.
import * as THREE from 'three';
import { createClickGuard } from '../architecture/pick.js';
const scratchNdc = new THREE.Vector2();
export function bindSceneEvents({ element, camera, bindings = [], correctPointer, }) {
    const active = new Set(bindings);
    const raycaster = new THREE.Raycaster();
    const guard = createClickGuard();
    let hovered = null;
    function hitFor(event, binding) {
        const rect = element.getBoundingClientRect();
        scratchNdc.set((event.clientX - rect.left) / rect.width * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
        const ndc = correctPointer ? correctPointer(scratchNdc) : scratchNdc;
        raycaster.setFromCamera(ndc, camera);
        const hits = raycaster.intersectObject(binding.object, binding.recursive ?? true);
        return hits[0] ?? null;
    }
    /** Nearest hit across all bindings that carry any of the given handlers. */
    function nearest(event, has) {
        let best = null;
        for (const binding of active) {
            if (!has(binding))
                continue;
            const hit = hitFor(event, binding);
            if (hit && (!best || hit.distance < best.hit.distance))
                best = { binding, hit };
        }
        return best;
    }
    const onDown = (event) => {
        guard.down(event.clientX, event.clientY);
        const found = nearest(event, b => !!b.onPointerDown);
        found?.binding.onPointerDown?.(found.hit, event);
    };
    const onUp = (event) => {
        const upTarget = nearest(event, b => !!b.onPointerUp);
        upTarget?.binding.onPointerUp?.(upTarget.hit, event);
        if (!guard.isClick(event.clientX, event.clientY))
            return;
        const tapped = nearest(event, b => !!b.onTap);
        tapped?.binding.onTap?.(tapped.hit, event);
    };
    const onMove = (event) => {
        let anyHover = false;
        for (const binding of active)
            if (binding.onEnter || binding.onLeave) {
                anyHover = true;
                break;
            }
        if (!anyHover)
            return;
        const found = nearest(event, b => !!b.onEnter || !!b.onLeave);
        const next = found?.binding ?? null;
        if (next === hovered)
            return;
        hovered?.onLeave?.();
        if (next && found)
            next.onEnter?.(found.hit);
        hovered = next;
    };
    element.addEventListener('pointerdown', onDown);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointermove', onMove);
    return {
        add(binding) {
            active.add(binding);
            return () => {
                if (hovered === binding)
                    hovered = null;
                active.delete(binding);
            };
        },
        dispose() {
            element.removeEventListener('pointerdown', onDown);
            element.removeEventListener('pointerup', onUp);
            element.removeEventListener('pointermove', onMove);
            active.clear();
            hovered = null;
        },
    };
}
// perf: medium. one raycast per binding per pointer event (hover raycasts only
// when enter/leave handlers exist); no per-frame work at all.
//# sourceMappingURL=scene-events.js.map