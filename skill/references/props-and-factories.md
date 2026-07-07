# Props & factories

A **prop** bundles an `Object3D` with optional animation clips, embedded light
sources, and an instancing hint behind one declarative definition. From the `props`
package (`@tuomashatakka/threejs-scenes`, or `@scenes`). See
[library-local.md](./library-local.md) for the importmap.

## defineProp + createProp

```js
import { defineProp, createProp } from '@scenes'
import { spinClip, bobClip } from '@scenes'

const crystal = defineProp({
  name:   'crystal',
  build:  (ctx) => new THREE.Mesh(geo, mat),         // ctx: PropContext { rng?, loop? }
  lights: (root) => [ new THREE.PointLight('#79f7ff', 6, 6) ],
  clips:  (root) => [ spinClip('y', 4), bobClip(0.25, 2) ],
})

const inst = createProp(crystal, ctx, { autoplay: true })
scene.add(inst.object)
// inst = { object, controller?, lights, dispose }
// later: inst.dispose()   // disposes geometry/materials/controller/lights it owns
```

`ctx` is a `PropContext { rng?, loop? }` — a `SceneContext` satisfies it, so pass the
scene context directly. When `clips` are present, `createProp` wires an
[`AnimationController`](./animation-system.md) onto `ctx.loop` and (by default)
plays every clip looping. Declared `lights` are parented under the object.

## Resolving props by source

```js
import { registerProp, resolveProp } from '@scenes'

registerProp('tree', treeFactory)
const a = await resolveProp(treeFactory, ctx)          // a factory object
const b = await resolveProp('tree', ctx)               // a registered name
const c = await resolveProp('./props/tree.js', ctx)    // a module — default/`prop` export
const d = await resolveProp('models/robot.glb', ctx)   // a model file (via loaders)
```

`resolveProp` always returns `Promise<PropInstance>`. A `.glb/.gltf` source is loaded
through the [loaders](./animation-system.md) module and its `scene` + baked
`animations` are wrapped into a controller automatically. This is what `<Prop src>`
in the [JSX layer](./jsx-layer.md) calls.

## Instancing a prop

```js
import { createInstancedProp } from '@scenes'

const forest = createInstancedProp(treeFactory, { count: 120, radius: 12, seed: 5 }, ctx)
scene.add(forest.object)   // single-mesh prop → ONE InstancedMesh draw call
```

If the prop builds to a single `Mesh`, it routes through `createInstancedField`
(one draw call for the whole field). Otherwise it falls back to cloning the built
group per instance — fine for low counts, but keep the prop a single mesh if you
want it cheap. Pass a `place(index, rng, object, color)` callback for custom layout.

## Composites

```js
import { createPropComposite } from '@scenes'

const lamp = createPropComposite([
  { prop: post,  position: [0, 0, 0] },
  { prop: bulb,  position: [0, 2, 0] },
])
scene.add(lamp.object)
lamp.dispose()   // disposes every part exactly once
```

A composite is just a `Group` — no extra draw cost. Each part keeps its own
controller; disposing the composite disposes all parts.

## Disposal contract

Every `PropInstance`/composite owns what it built. Call `dispose()` on teardown; it
unregisters the controller tick from the loop and frees geometry/materials/lights.
Props built from shared/pooled materials should not dispose those — keep shared
materials out of the prop's `build`, or pool them.
