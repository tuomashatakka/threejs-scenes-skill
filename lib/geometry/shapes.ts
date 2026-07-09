// lib/geometry/shapes.ts
// THREE.Shape builders — 2D profiles you feed into createExtrudedMesh or
// THREE.ShapeGeometry. Shapes are the cheapest way to author bespoke silhouettes
// (signage, cogs, stars, rounded panels) without hand-rolling BufferGeometry.

import * as THREE from 'three'


/** Rounded rectangle `Shape` centered on the origin; `radius` clamps to half the smaller side. */
export function roundedRectShape (width: number, height: number, radius: number): THREE.Shape {
  const r  = Math.min(radius, width / 2, height / 2)
  const hw = width / 2
  const hh = height / 2
  const s  = new THREE.Shape()
  s.moveTo(-hw + r, -hh)
  s.lineTo(hw - r, -hh)
  s.quadraticCurveTo(hw, -hh, hw, -hh + r)
  s.lineTo(hw, hh - r)
  s.quadraticCurveTo(hw, hh, hw - r, hh)
  s.lineTo(-hw + r, hh)
  s.quadraticCurveTo(-hw, hh, -hw, hh - r)
  s.lineTo(-hw, -hh + r)
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh)
  return s
}

/** Regular polygon `Shape` with `sides` vertices on a circle of `radius`, first vertex at the top. */
export function polygonShape (sides: number, radius: number): THREE.Shape {
  const s = new THREE.Shape()
  for (let i = 0; i <= sides; i++) {
    const a = i / sides * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * radius
    const y = Math.sin(a) * radius
    if (i === 0)
      s.moveTo(x, y)
    else
      s.lineTo(x, y)
  }
  return s
}

/** Star `Shape` alternating between `outerRadius` tips and `innerRadius` valleys. */
export function starShape (points: number, outerRadius: number, innerRadius: number): THREE.Shape {
  const s     = new THREE.Shape()
  const total = points * 2
  for (let i = 0; i <= total; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius
    const a = i / total * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0)
      s.moveTo(x, y)
    else
      s.lineTo(x, y)
  }
  return s
}

/** Gear `Shape` with square-profile `teeth` and a center hole of `innerRadius`. `toothDepth` is the tooth height as a fraction of the outer radius. */
export function gearShape (teeth: number, outerRadius: number, innerRadius: number, toothDepth = 0.25): THREE.Shape {
  const s     = new THREE.Shape()
  const steps = teeth * 4
  const tip   = outerRadius
  const root  = outerRadius * (1 - toothDepth)
  for (let i = 0; i <= steps; i++) {
    const phase = i % 4
    const r     = phase === 0 || phase === 3 ? root : tip
    const a     = i / steps * Math.PI * 2
    const x     = Math.cos(a) * r
    const y     = Math.sin(a) * r
    if (i === 0)
      s.moveTo(x, y)
    else
      s.lineTo(x, y)
  }

  // bore hole
  const hole = new THREE.Path()
  hole.absarc(0, 0, Math.max(0.01, innerRadius), 0, Math.PI * 2, true)
  s.holes.push(hole)
  return s
}

/** Annulus `Shape`: a disc of `outerRadius` with an `innerRadius` hole. */
export function ringShape (outerRadius: number, innerRadius: number): THREE.Shape {
  const s = new THREE.Shape()
  s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false)

  const hole = new THREE.Path()
  hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true)
  s.holes.push(hole)
  return s
}

// perf: cheap. Shapes are CPU-side path data; cost lands when triangulated by
// ExtrudeGeometry/ShapeGeometry. Reuse a Shape across many extrusions.
