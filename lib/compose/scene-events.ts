// lib/compose/scene-events.ts
// Declarative pointer-event -> raycast binding: register scene objects with
// handlers and get tap / down / up / enter / leave callbacks with the hit
// intersection, instead of hand-rolling a raycaster per app. Uses pointer*
// events exclusively and the click-vs-drag guard from architecture/pick.

import * as THREE from 'three'

import { createClickGuard } from '../architecture/pick.js'
import type { Disposable } from '../types.js'


export interface SceneEventHandlers {
  onTap?:         (hit: THREE.Intersection, event: PointerEvent) => void
  onPointerDown?: (hit: THREE.Intersection, event: PointerEvent) => void
  onPointerUp?:   (hit: THREE.Intersection, event: PointerEvent) => void
  onEnter?:       (hit: THREE.Intersection) => void
  onLeave?:       () => void
}

export interface SceneEventBinding extends SceneEventHandlers {
  object: THREE.Object3D

  /** Raycast descendants too. Default true. */
  recursive?: boolean
}

export interface SceneEventsOptions {
  element:   HTMLElement
  camera:    THREE.Camera
  bindings?: SceneEventBinding[]

  /** Invert screen-space distortion (e.g. CRT warp) before raycasting. */
  correctPointer?: (ndc: THREE.Vector2) => THREE.Vector2
}

export interface SceneEvents extends Disposable {

  /** Register a binding; returns its unbinder. */
  add (binding: SceneEventBinding): () => void
}

const scratchNdc = new THREE.Vector2()

export function bindSceneEvents ({
  element,
  camera,
  bindings = [],
  correctPointer,
}: SceneEventsOptions): SceneEvents {
  const active    = new Set<SceneEventBinding>(bindings)
  const raycaster = new THREE.Raycaster()
  const guard     = createClickGuard()
  let hovered: SceneEventBinding | null = null

  function hitFor (event: PointerEvent, binding: SceneEventBinding): THREE.Intersection | null {
    const rect = element.getBoundingClientRect()
    scratchNdc.set(
      (event.clientX - rect.left) / rect.width * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    )

    const ndc = correctPointer ? correctPointer(scratchNdc) : scratchNdc
    raycaster.setFromCamera(ndc, camera)

    const hits = raycaster.intersectObject(binding.object, binding.recursive ?? true)
    return hits[0] ?? null
  }

  /** Nearest hit across all bindings that carry any of the given handlers. */
  function nearest (
    event: PointerEvent,
    has: (b: SceneEventBinding) => boolean,
  ): { binding: SceneEventBinding, hit: THREE.Intersection } | null {
    let best: { binding: SceneEventBinding, hit: THREE.Intersection } | null = null
    for (const binding of active) {
      if (!has(binding))
        continue

      const hit = hitFor(event, binding)
      if (hit && (!best || hit.distance < best.hit.distance))
        best = { binding, hit }
    }
    return best
  }

  const onDown = (event: PointerEvent): void => {
    guard.down(event.clientX, event.clientY)

    const found = nearest(event, b => !!b.onPointerDown)
    found?.binding.onPointerDown?.(found.hit, event)
  }

  const onUp = (event: PointerEvent): void => {
    const upTarget = nearest(event, b => !!b.onPointerUp)
    upTarget?.binding.onPointerUp?.(upTarget.hit, event)
    if (!guard.isClick(event.clientX, event.clientY))
      return

    const tapped = nearest(event, b => !!b.onTap)
    tapped?.binding.onTap?.(tapped.hit, event)
  }

  const onMove = (event: PointerEvent): void => {
    let anyHover = false
    for (const binding of active)
      if (binding.onEnter || binding.onLeave) {
        anyHover = true
        break
      }
    if (!anyHover)
      return

    const found = nearest(event, b => !!b.onEnter || !!b.onLeave)
    const next  = found?.binding ?? null
    if (next === hovered)
      return
    hovered?.onLeave?.()
    if (next && found)
      next.onEnter?.(found.hit)
    hovered = next
  }

  element.addEventListener('pointerdown', onDown)
  element.addEventListener('pointerup', onUp)
  element.addEventListener('pointermove', onMove)

  return {
    add (binding) {
      active.add(binding)
      return () => {
        if (hovered === binding)
          hovered = null
        active.delete(binding)
      }
    },
    dispose () {
      element.removeEventListener('pointerdown', onDown)
      element.removeEventListener('pointerup', onUp)
      element.removeEventListener('pointermove', onMove)
      active.clear()
      hovered = null
    },
  }
}

// perf: medium. one raycast per binding per pointer event (hover raycasts only
// when enter/leave handlers exist); no per-frame work at all.
