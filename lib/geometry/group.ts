// lib/geometry/group.ts
// Grouping + layout helpers. createGroup parents children with an optional
// transform; the layout* helpers arrange an array of objects in place (grid,
// radial ring, stacked along an axis). Layouts mutate object positions and
// return the same array for chaining.

import * as THREE from 'three'

import type { Axis } from './modifiers.js'


/** Optional position/Euler-rotation/scale applied when grouping or placing objects. */
export interface Transform {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?:    number | [number, number, number]
}

/** Group `children` under one `Group` with an optional {@link Transform} applied. */
export function createGroup (children: THREE.Object3D[] = [], transform: Transform = {}): THREE.Group {
  const group = new THREE.Group()
  children.forEach(c => group.add(c))
  if (transform.position)
    group.position.fromArray(transform.position)
  if (transform.rotation)
    group.rotation.fromArray(transform.rotation as [number, number, number])
  if (transform.scale !== undefined) {
    if (typeof transform.scale === 'number')
      group.scale.setScalar(transform.scale)
    else
      group.scale.fromArray(transform.scale)
  }
  return group
}

/** Options for {@link layoutGrid}: column count (default √n), `spacing`, and layout plane. */
export interface GridLayout {
  cols?:    number
  spacing?: number
  plane?:   'xz' | 'xy'
}

/** Arrange objects in a centered grid on the `xz` (default) or `xy` plane, mutating their positions. Returns the same array. */
export function layoutGrid (objects: THREE.Object3D[], options: GridLayout = {}): THREE.Object3D[] {
  const { spacing = 2, plane = 'xz' } = options
  const cols                          = options.cols ?? Math.ceil(Math.sqrt(objects.length))
  const rows                          = Math.ceil(objects.length / cols)
  const ox                            = (cols - 1) * spacing / 2
  const oy                            = (rows - 1) * spacing / 2
  objects.forEach((obj, i) => {
    const cx = i % cols * spacing - ox
    const cy = Math.floor(i / cols) * spacing - oy
    if (plane === 'xz')
      obj.position.set(cx, obj.position.y, cy)
    else
      obj.position.set(cx, cy, obj.position.z)
  })
  return objects
}

/** Options for {@link layoutRadial}: circle `radius`, `startAngle`, and whether items rotate to face the center. */
export interface RadialLayout {
  radius?:     number
  startAngle?: number
  faceCenter?: boolean
}

/** Arrange objects evenly around a circle in the ground plane, optionally facing the center. Mutates positions; returns the same array. */
export function layoutRadial (objects: THREE.Object3D[], options: RadialLayout = {}): THREE.Object3D[] {
  const { radius = 5, startAngle = 0, faceCenter = false } = options
  const n                                                  = objects.length
  objects.forEach((obj, i) => {
    const a = startAngle + i / n * Math.PI * 2
    obj.position.set(Math.cos(a) * radius, obj.position.y, Math.sin(a) * radius)
    if (faceCenter)
      obj.rotation.y = -a + Math.PI / 2
  })
  return objects
}

/** Stack objects along `axis` at `spacing` intervals, centered on the origin. Mutates positions; returns the same array. */
export function layoutStack (objects: THREE.Object3D[], axis: Axis = 'y', spacing = 1): THREE.Object3D[] {
  const offset = (objects.length - 1) * spacing / 2
  objects.forEach((obj, i) => {
    obj.position[axis] = i * spacing - offset
  })
  return objects
}

/** World-space bounding box of an object and all its descendants. */
export function groupBounds (obj: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(obj)
}

// perf: cheap. Pure CPU transform writes; no geometry work.
