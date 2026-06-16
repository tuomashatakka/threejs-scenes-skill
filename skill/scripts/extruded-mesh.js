// scripts/extruded-mesh.js
// Programmatic extruded + lathe meshes built from the library's geometry module.
// In a live artifact the '@tuomashatakka/threejs-scenes' specifier maps via
// importmap to the local copy './lib/dist/index.js' (see references/library-local.md).

import {
  createExtrudedMesh, createLatheMesh, createStandardMaterial,
  starShape, gearShape, roundedRectShape, layoutGrid,
} from '@tuomashatakka/threejs-scenes'


export function buildExtrudedShowcase (scene) {
  const star = createExtrudedMesh({
    shape: starShape(5, 1, 0.5), depth: 0.6, material: createStandardMaterial('gold'),
  })

  const gear = createExtrudedMesh({
    shape: gearShape(12, 1, 0.35, 0.3), depth: 0.4, material: createStandardMaterial('metal'),
  })

  const panel = createExtrudedMesh({
    shape: roundedRectShape(1.8, 1.2, 0.3), depth: 0.3,
    material: createStandardMaterial('plastic', { color: '#5fb0ff' }),
  })

  // half-profile (x = radius, y = height) revolved into a vase
  const vase = createLatheMesh(
    [ [ 0.0, -1 ], [ 0.6, -0.9 ], [ 0.35, -0.2 ], [ 0.55, 0.6 ], [ 0.2, 1 ] ],
    { material: createStandardMaterial('chrome') },
  )

  const items = [ star, gear, panel, vase ]
  layoutGrid(items, { cols: 2, spacing: 3 })
  items.forEach(m => scene.add(m))

  return { items, dispose () { items.forEach(m => { m.geometry.dispose(); m.material.dispose() }) } }
}

// perf: medium build-time triangulation; each mesh is one draw call at runtime.
