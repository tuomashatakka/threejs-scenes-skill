# Camera Handling

Camera setup and control patterns that work on every input device.

## Touch-First Mandate

Every camera control handler MUST work identically with mouse, touch, pen, and
stylus. That means:

- **Only pointer events**. Never bind `mousedown` / `mousemove` / `mouseup` or
  `touchstart` / `touchmove` / `touchend`. Pointer events unify them and provide
  `pointerType` if you need to branch.
- **Pointer capture** via `target.setPointerCapture(e.pointerId)` so drags
  don't break when the pointer leaves the canvas.
- **Multi-touch gestures** (pinch zoom, two-finger pan) by tracking active
  pointers in a `Map<number, PointerState>`.
- **`{ passive: false }`** on the wheel listener so `preventDefault` works for
  zoom.
- **`touch-action: none`** CSS rule on the canvas element to suppress native
  gesture handling. Without this, iOS Safari will fight you forever.
- **Inertia / damping** on every drag, pan, and rotate. Raw input feels
  jittery on touchscreens.
- **Handle `pointercancel`** as if it were `pointerup`. iOS fires it
  aggressively.

The unified gesture handler lives in `scripts/pointer-gesture.js`. It exposes
`onDrag`, `onPinch`, `onWheel`, `onTap` callbacks.

## Camera Patterns

- **`OrbitControls`** for inspecting models. Always set `enableDamping = true`,
  `dampingFactor ≈ 0.08`. Cap `minPolarAngle` / `maxPolarAngle` to prevent
  gimbal flips on touch.
- **`MapControls`** for iso/topdown. Locks rotation, allows pan + zoom only.
- **Follow camera** with critically-damped springs for character cams. Lerp
  target with `1 - exp(-k * delta)` so behavior is framerate-independent. See
  `scripts/follow-camera.js`.
- **Path camera** (cinematic). Define a `CatmullRomCurve3`, advance `t` over
  time, `camera.position.copy(curve.getPoint(t))`, `camera.lookAt(curve.getPoint(t + ε))`.
- **Camera shake** as additive: store base position/quat, add filtered noise
  in screen space per frame, restore base before next physics update.

## Built-in Controls

three.js ships several controls in `three/addons/controls/`. All of them
respond to pointer events natively in recent versions — they used to bind
mouse + touch separately, but as of r150+ they use pointer events internally.

```js
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.dampingFactor = 0.08
controls.maxPolarAngle = Math.PI * 0.49     // can't look from below
controls.minDistance = 2
controls.maxDistance = 50
controls.target.set(0, 0, 0)

// each frame
controls.update()
```

For touch-specific tuning:

```js
controls.touches = {
  ONE: THREE.TOUCH.ROTATE,
  TWO: THREE.TOUCH.DOLLY_PAN,
}
```

## Custom Pointer Gesture Layer

When OrbitControls doesn't fit (custom camera rigs, game cameras with WASD,
parallax explorers), wire `scripts/pointer-gesture.js` directly:

```js
import { attachPointerGesture } from './pointer-gesture.js'

const detach = attachPointerGesture(canvas, {
  onDrag (dx, dy, e) {
    camera.rotation.y -= dx * 0.005
    camera.rotation.x = Math.max(-1.4, Math.min(1.4, camera.rotation.x - dy * 0.005))
  },
  onPinch (deltaScale) {
    camera.position.multiplyScalar(1 / deltaScale)
  },
  onWheel (delta) {
    camera.position.multiplyScalar(1 + delta * 0.001)
  },
  onTap (x, y) {
    // raycast for object selection
  },
})

// on teardown
detach()
```

## Follow Camera

For third-person and character cameras, use a critically-damped spring.
Framerate-independent.

```js
const scratchDesired = new THREE.Vector3()
const scratchTarget = new THREE.Vector3()

function createFollowCamera (camera, target, { offset, stiffness = 8 }) {
  return ({ delta }) => {
    target.getWorldPosition(scratchTarget)
    scratchDesired.copy(offset).applyQuaternion(target.quaternion).add(scratchTarget)
    const t = 1 - Math.exp(-stiffness * delta)
    camera.position.lerp(scratchDesired, t)
    camera.lookAt(scratchTarget)
  }
}
```

## Resize Handling

Use `ResizeObserver` on the canvas's parent, not `window.resize` — it catches
devtools open/close and layout reflows.

```js
const ro = new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect
  renderer.setSize(width, height, false)   // third arg keeps CSS size in sync
  if (camera.isPerspectiveCamera) {
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  } else if (camera.isOrthographicCamera) {
    resizeIsoCamera(camera, width / height)
  }
})
ro.observe(canvas.parentElement)
```

## Raycasting from Pointer

The pattern works identically for mouse and touch when you use pointer events:

```js
const raycaster = new THREE.Raycaster()
const ndc = new THREE.Vector2()

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect()
  ndc.x = ((e.clientX - rect.left) / rect.width)  * 2 - 1
  ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObjects(scene.children, true)
  if (hits.length > 0) onPick(hits[0])
})
```

## Common Pitfalls

- Using `mouse*` or `touch*` events instead of `pointer*`.
- Forgetting `setPointerCapture` — drag breaks the moment the finger leaves
  the canvas.
- Missing `touch-action: none` on the canvas — iOS triggers page-level
  pinch/scroll.
- `OrbitControls` without damping — touch input feels jittery.
- Camera controls without polar angle clamping — users flip the camera and
  get disoriented.
- Resize handler on `window.resize` instead of `ResizeObserver` — misses
  devtools-induced layout changes.
- Computing NDC from `clientX/Y` without subtracting `canvas.getBoundingClientRect()`
  — raycasts off-screen when canvas isn't at origin.
- Updating `OrbitControls.target` without re-fitting `controls.minDistance`
  — camera can clip into the new target.
