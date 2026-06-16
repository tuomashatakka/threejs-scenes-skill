// lib/geometry/group.ts
// Grouping + layout helpers. createGroup parents children with an optional
// transform; the layout* helpers arrange an array of objects in place (grid,
// radial ring, stacked along an axis). Layouts mutate object positions and
// return the same array for chaining.

import * as THREE from 'three'

import type { Axis } from './modifiers.js'


export interface Transform {
  position?: [number, number, number]
  rotation?: [number, number, number]
  scale?:    number | [number, number, number]
}

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

export interface GridLayout {
  cols?:    number
  spacing?: number
  plane?:   'xz' | 'xy'
}

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

export interface RadialLayout {
  radius?:     number
  startAngle?: number
  faceCenter?: boolean
}

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

export function layoutStack (objects: THREE.Object3D[], axis: Axis = 'y', spacing = 1): THREE.Object3D[] {
  const offset = (objects.length - 1) * spacing / 2
  objects.forEach((obj, i) => {
    obj.position[axis] = i * spacing - offset
  })
  return objects
}

export function groupBounds (obj: THREE.Object3D): THREE.Box3 {
  return new THREE.Box3().setFromObject(obj)
}

// perf: cheap. Pure CPU transform writes; no geometry work.
