// lib/geometry/extrude.ts
// Extruded meshes from 2D shapes/points. createExtrudedMesh wraps
// ExtrudeGeometry with sane bevel defaults; extrudeAlongPath sweeps a profile
// along a 3D curve. Pair with shapes.ts for bespoke silhouettes.

import * as THREE from 'three'


function pointsToShape (points: ReadonlyArray<readonly [number, number]>): THREE.Shape {
  const s = new THREE.Shape()
  points.forEach(([ x, y ], i) => i === 0 ? s.moveTo(x, y) : s.lineTo(x, y))
  return s
}

/** Options for {@link createExtrudedMesh}: the 2D profile (`shape` or raw `points`), depth, bevel tuning, and material. */
export interface ExtrudeOptions {
  shape?:          THREE.Shape | THREE.Shape[]
  points?:         ReadonlyArray<readonly [number, number]>
  depth?:          number
  bevel?:          boolean
  bevelThickness?: number
  bevelSize?:      number
  bevelSegments?:  number
  steps?:          number
  curveSegments?:  number
  material?:       THREE.Material
}

/**
 * Extrude a 2D profile into a bevelled mesh. Pass a `Shape` (compose with
 * the helpers in `geometry/shapes`) or raw `points` to auto-build one.
 *
 * @param options - Profile, `depth` (default 1), bevel settings (on by
 * default), and material (default matte standard).
 * @returns The extruded mesh with shadows enabled.
 * @example
 * const gear = createExtrudedMesh({ shape: gearShape(12, 2, 1.4), depth: 0.5 })
 */
export function createExtrudedMesh (options: ExtrudeOptions): THREE.Mesh {
  const {
    shape,
    points,
    depth = 1,
    bevel = true,
    bevelThickness = 0.05,
    bevelSize = 0.05,
    bevelSegments = 2,
    steps = 1,
    curveSegments = 12,
    material = new THREE.MeshStandardMaterial({ color: '#9aa7b5', roughness: 0.6, metalness: 0.1 }),
  } = options

  const profile = shape ?? (points ? pointsToShape(points) : null)
  if (!profile)
    throw new Error('createExtrudedMesh: provide `shape` or `points`')

  const geometry = new THREE.ExtrudeGeometry(profile as THREE.Shape, {
    depth,
    bevelEnabled: bevel,
    bevelThickness,
    bevelSize,
    bevelSegments,
    steps,
    curveSegments,
  })
  geometry.center()
  geometry.computeVertexNormals()

  const mesh         = new THREE.Mesh(geometry, material)
  mesh.castShadow    = true
  mesh.receiveShadow = true
  return mesh
}

/** Options for {@link extrudeAlongPath}: sweep `steps`, bevel toggle, curve resolution, and material. */
export interface ExtrudeAlongPathOptions {
  steps?:         number
  bevel?:         boolean
  curveSegments?: number
  material?:      THREE.Material
}

/** Sweep a 2D `shape` along a 3D curve into a mesh — rails, pipes, ribbons. `steps` controls sweep resolution (default 64). */
export function extrudeAlongPath (
  shape: THREE.Shape,
  path: THREE.Curve<THREE.Vector3>,
  options: ExtrudeAlongPathOptions = {},
): THREE.Mesh {
  const {
    steps = 64,
    bevel = false,
    curveSegments = 12,
    material = new THREE.MeshStandardMaterial({ color: '#9aa7b5', roughness: 0.6 }),
  } = options

  const geometry = new THREE.ExtrudeGeometry(shape, {
    steps,
    bevelEnabled: bevel,
    curveSegments,
    extrudePath:  path,
  })
  geometry.computeVertexNormals()
  return new THREE.Mesh(geometry, material)
}

// perf: medium. ExtrudeGeometry triangulates on the CPU at build time; the mesh
// renders as one draw call. Dispose geometry + material on teardown.
