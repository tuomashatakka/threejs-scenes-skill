# Geometry — programmatic meshes & grouping

Build bespoke geometry in code instead of importing models. All factories live in
the `geometry` module (`@tuomashatakka/threejs-scenes/geometry`, or the `@scenes`
barrel — see [library-local.md](./library-local.md) for the importmap).

## Shape builders

Return a `THREE.Shape` you feed to extrusion or `THREE.ShapeGeometry`:

```js
import { roundedRectShape, polygonShape, starShape, gearShape, ringShape } from '@scenes'

roundedRectShape(width, height, radius)
polygonShape(sides, radius)
starShape(points, outerRadius, innerRadius)
gearShape(teeth, outerRadius, innerRadius, toothDepth = 0.25)  // bored center
ringShape(outerRadius, innerRadius)                            // annulus with a hole
```

## Extrusion & lathe

```js
import { createExtrudedMesh, extrudeAlongPath, createLatheMesh } from '@scenes'

// from a shape OR raw 2D points; centered + normals computed; casts/receives shadow
const badge = createExtrudedMesh({ shape: starShape(5, 1, 0.5), depth: 0.6, bevel: true, material })
const pipe  = extrudeAlongPath(profileShape, new THREE.CatmullRomCurve3(points), { steps: 64 })
const vase  = createLatheMesh([[0.2, 0], [0.6, 0.4], [0.3, 1]], { segments: 32 })  // x=radius, y=height
```

`createExtrudedMesh` options: `{ shape | points, depth, bevel, bevelThickness, bevelSize, steps, curveSegments, material }`. Default material is a neutral `MeshStandardMaterial`.

## Vertex deformers (in place, build-time)

Mutate the `position` attribute, recompute normals, return the same geometry for chaining:

```js
import { applyTwist, applyTaper, applyBend, displaceByNoise } from '@scenes'

applyTwist(geo, Math.PI, 'y')          // rotation grows 0→angle along the axis
applyTaper(geo, 0.4, 'y')              // perpendicular axes scale 1→factor
applyBend(geo, Math.PI / 2, 'x')       // bend into an arc
displaceByNoise(geo, { amp: 0.25, freq: 1.2, seed: 7 })  // push along normals; or pass { rng }
```

`displaceByNoise` reuses the deterministic hash from `procedural` — same seed, same rock.

## Addon wrappers (return a NEW geometry)

Thin wrappers over `three/addons` modifiers + `BufferGeometryUtils`:

```js
import { simplifyGeometry, tessellateGeometry, edgeSplit, mergeVertices, recomputeNormals } from '@scenes'

simplifyGeometry(geo, targetVertexCount)
tessellateGeometry(geo, maxEdgeLength, iterations)
edgeSplit(geo, cutOffAngleRad)         // keep hard creases sharp under flat shading
mergeVertices(geo, tolerance)          // weld duplicates → indexed
```

These are expensive — run at build/load, never per frame.

## Merging & grouping

```js
import { mergeMeshes, createGroup, layoutGrid, layoutRadial, layoutStack, groupBounds } from '@scenes'

const batched = mergeMeshes(meshes)    // → one Mesh per material; bakes each local matrix
const g = createGroup([a, b, c], { position: [0, 1, 0], scale: 2 })
layoutGrid(objects, { cols: 4, spacing: 2, plane: 'xz' })
layoutRadial(objects, { radius: 5, faceCenter: true })
layoutStack(objects, 'y', 1)
const box = groupBounds(scene)         // THREE.Box3
```

## Merge vs instance — pick one

- **`mergeMeshes`** — many *different*, *static* shapes (a building, scattered rocks of varied geometry). Collapses to one draw call per material. You lose per-object culling and independent movement.
- **`createInstancedField` / `createBatchedBuildings`** (see [instancing.md](./instancing.md)) — the *same* geometry repeated many times, especially if instances move or need per-instance data.

Rule of thumb: repeated identical geometry → instance; a fixed pile of distinct static parts → merge.

## Disposal

Every geometry you build owns GPU memory. Dispose it (or `disposeScene(root)`) on teardown — three.js never auto-frees. Deformers mutate in place so there is one geometry to dispose; addon wrappers create a new geometry, so dispose the original if you discard it.

## Live three.js docs

- API pages: [ExtrudeGeometry](https://threejs.org/docs/pages/ExtrudeGeometry.html.md), [LatheGeometry](https://threejs.org/docs/pages/LatheGeometry.html.md), [ShapeGeometry](https://threejs.org/docs/pages/ShapeGeometry.html.md), [TubeGeometry](https://threejs.org/docs/pages/TubeGeometry.html.md), [module-BufferGeometryUtils](https://threejs.org/docs/pages/module-BufferGeometryUtils.html.md).
- Manual: `node scripts/query-threejs-docs.js manual en/custom-buffergeometry` (also `en/primitives`). Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
