# JSX layer — reactive scenes on the frame loop

A higher-level declarative layer over the library, à la react-three-fiber but
coarser-grained (props, lights, whole scenes are single elements). Import from
`@tuomashatakka/threejs-scenes/jsx` (the `@scenes/jsx` importmap entry — see
[library-local.md](./library-local.md)).

## The big idea: the loop IS the scheduler

There is **no virtual-DOM diff**. `render()` mounts the tree once into real three
objects, then on every frame it re-reads the **reactive props** and applies them.
A prop whose value is a **function** is reactive (re-evaluated + applied each frame);
a plain value is applied once at mount. Reconciliation == the render tick.

## render()

```js
import { render, h, signal } from '@scenes/jsx'

const app = render(tree, { canvas, seed, background, orbit })
// → { scene, renderer, loop, getCamera, dispose }
app.dispose()
```

`orbit` (default true) attaches pointer-orbit to a perspective camera unless a
`follow` camera claims it.

## Authoring: JSX or hyperscript

Hyperscript needs **no build step** — ideal for artifacts:

```js
const [ angle, setAngle ] = signal(0)

const app = render(
  h('scene', { background: '#0a0a14' },
    h('camera', { type: 'perspective', position: [0, 2.5, 7], makeDefault: true }),
    h('light', { type: 'hemisphere', intensity: 0.7 }),
    h('light', { type: 'spot', position: [5, 8, 3], intensity: 60, castShadow: true }),
    h('group', { rotation: () => [0, angle(), 0] },          // reactive accessor
      h('mesh', { geometry: new THREE.IcosahedronGeometry(1, 0), material: cyan, position: [-1.8, 0, 0] }),
      h('mesh', { geometry: knotGeo, material: pink, position: [1.8, 0, 0] }),
    ),
  ),
  { canvas },
)
app.loop.onFrame(({ delta }) => setAngle(a => a + delta * 0.6))  // signal drives the rotation
```

For `.tsx` JSX syntax, set `tsconfig`: `"jsx": "react-jsx"`,
`"jsxImportSource": "@tuomashatakka/threejs-scenes/jsx"`. The runtime also exports
`jsx`/`jsxs`/`Fragment`.

## Reactivity

```js
import { signal, derived } from '@scenes/jsx'
const [ get, set ] = signal(0)
```

Pass an accessor where a value goes: `position={() => [x(), 0, 0]}`. **`place` and
`on*` props are never treated as reactive** (they're callbacks), so they're applied
once as-is.

## Intrinsics

| Element | Key props |
| --- | --- |
| `<scene>` | `background`, `environment` |
| `<camera>` | `type` `perspective`\|`iso`\|`follow`, `makeDefault`, `fov`, `near`, `far`, `position`, `lookAt`, `target`, `offset`, `viewSize`, `flavor` |
| `<light>` | `type` `spot`\|`point`\|`directional`\|`ambient`\|`hemisphere`, `color`, `intensity`, `angle`, `penumbra`, `distance`, `decay`, `groundColor`, `position` |
| `<group>` | transforms (`position`/`rotation`/`scale`/`visible`/`lookAt`) |
| `<mesh>` | `geometry`, `material` + transforms |
| `<primitive>` | `object` (wrap an existing Object3D) |
| `<prop>` | `src` (factory \| `.ts` module \| model file), `autoplay` — see [props-and-factories.md](./props-and-factories.md) |
| `<instances>` | `factory` \| `src`, `count`, `radius`, `seed`, `place` |
| `<post>` | `bloom`, `bloomStrength`, `bloomRadius`, `bloomThreshold` (builds an EffectComposer) |

Function components compose: `const Tree = (props) => h('prop', { src: treeFactory, ...props })`.

## Lifecycle & disposal

`app.dispose()` stops the loop, detaches input/resize, disposes every host (props,
instances, composer, lights) and the whole scene, then the renderer. Async elements
(`<prop src>`, `<instances src>`) attach when their import/load resolves. Runnable
example: `skill/templates/jsx-scene.html`.
