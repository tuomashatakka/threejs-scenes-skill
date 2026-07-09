// lib/props/instanced-prop.ts
// Instance a prop N times. If the prop builds to a single Mesh we route through
// createInstancedField (one draw call for the whole field). Otherwise we fall
// back to cloning the built group per instance (still cheap for low counts).

import * as THREE from 'three'

import { createInstancedField } from '../instancing/instanced-field.js'
import { disposeScene } from '../core/dispose.js'
import { mulberry32 } from '../procedural/rng.js'
import type { InstancePlaceFn, PropContext, PropFactory } from '../types.js'


/** Placement options for {@link createInstancedProp}: instance `count`, scatter `radius`, deterministic `seed`, and a custom `place` callback. */
export interface InstancedPropOptions {
  count:   number
  radius?: number
  seed?:   number
  place?:  InstancePlaceFn
}

/** The instanced field. `dispose()` frees the instanced geometry it owns. */
export interface InstancedPropResult {
  object: THREE.Object3D
  dispose (): void
}

const scratch = new THREE.Object3D()

/**
 * Scatter one prop as an `InstancedMesh` field: builds a single sample from
 * the factory, then instances its geometry/material `count` times within
 * `radius`. One draw call regardless of count.
 *
 * @param factory - Prop definition; its `instanced` hint merges under `options`.
 * @param options - Count/radius/seed/placement overrides.
 * @param ctx - Prop context (rng, loop).
 * @returns An {@link InstancedPropResult} ready to add to the scene.
 * @remarks Placement is seeded and deterministic. Non-mesh sample roots fall
 * back to per-instance clones grouped under one parent.
 */
export function createInstancedProp (
  factory: PropFactory,
  options: InstancedPropOptions,
  ctx: PropContext = {},
): InstancedPropResult {
  const merged                                  = { ...factory.instanced, ...options }
  const { count, radius = 10, seed = 1, place } = merged
  const sample                                  = factory.build(ctx)

  if (sample instanceof THREE.Mesh) {
    const mesh = createInstancedField({
      geometry: sample.geometry,
      material: sample.material as THREE.Material,
      count,
      radius,
      seed,
      place,
    })
    return {
      object: mesh,
      dispose () {
        mesh.geometry.dispose()

        const mat = mesh.material as THREE.Material
        mat.dispose()
        mesh.dispose()
      },
    }
  }

  // group fallback — clone per instance, place with the same callback contract.
  const group = new THREE.Group()
  const rng   = mulberry32(seed)
  const color = new THREE.Color()
  for (let i = 0; i < count; i++) {
    const clone = sample.clone()
    if (place) {
      place(i, rng, scratch, color)
      clone.position.copy(scratch.position)
      clone.quaternion.copy(scratch.quaternion)
      clone.scale.copy(scratch.scale)
    }
    else {
      const angle = rng() * Math.PI * 2
      const dist  = Math.sqrt(rng()) * radius
      clone.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist)
      clone.rotation.y = rng() * Math.PI * 2
    }
    group.add(clone)
  }
  disposeScene(sample)
  return {
    object: group,
    dispose () {
      disposeScene(group)
    },
  }
}

// perf: single-mesh props -> 1 draw call regardless of count. Group fallback is
// N draw calls (× the prop's mesh count) — keep counts modest or merge first.
