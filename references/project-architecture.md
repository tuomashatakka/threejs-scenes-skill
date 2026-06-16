# Project Architecture

How to organize a three.js project so it scales past the prototype stage.

## Folder Structure

```
src/
  renderer/
    create-renderer.js          // WebGLRenderer factory + capability detection
  scene/
    create-scene.js             // Scene composition root
    <feature-name>/             // One folder per scene feature
      index.js                  // Public factory
      geometry.js               // Programmatic BufferGeometry builders
      material.js               // ShaderMaterial / MeshStandardMaterial factory
      shader.js                 // GLSL fragment + vertex
      instances.js              // Instance / batch transform generation
  camera/
    create-iso-camera.js
    create-perspective-camera.js
    controls/
      create-orbit-controls.js
      create-pan-zoom-controls.js
      create-follow-camera.js
      pointer-gesture.js        // Unified pointer + pinch + drag
  world/
    chunk-manager.js
    chunk-pool.js
    infinite-grid.js
    voxel/
      chunk.js
      greedy-mesh.js
      voxel-data.js
  post/
    composer.js                 // EffectComposer factory
    passes/
      glitch.js
      bloom.js
      lens-flare.js
      god-rays.js
      dof.js
      stereoscopy.js
      film-grain.js
      hud-beam-transition.js
  billboards/
    create-sprite-batch.js
    billboard-material.js
  systems/
    loop.js                     // Wraps frameLoopManager + three.js render
    loader.js
    texture-factory.js
    lighting.js
  materials/                    // Reusable ShaderMaterial library
  shaders/                      // Reusable GLSL chunks
  utils/
    math/                       // Pure math helpers (noise, easing, lattice)
    dispose.js                  // Recursive scene cleanup
    debug.js                    // stats.js, lil-gui wiring (dev-only)
  config/
    scene.config.js
    quality.config.js           // Pixel ratio caps, shadow res, LOD tiers
  llm/
    functions/                  // ai-sdk / gemini tool schemas
    prompts/
    codegen/                    // Scripts that emit code from LLM output
  style/                        // Semantic Nodes CSS (canvas overlay UI only)
    tokens.css
    base.css
    layout.css
```

## Frame Loop Integration

`frameLoopManager` from `@tuomashatakka/canvas-loop-framecapper` is the single
source of truth for the render loop. It exposes:

- `deltaTime` (seconds since last tick)
- `totalTime` (seconds since first tick)
- `isPaused` (boolean)
- `setFixedFrameRate(fps)` — pass 0 for uncapped
- `pause()` / `resume()` / `reset()`
- `registerSyncCallback(cb)` / `registerAsyncCallback(cb)`
- `unregisterSyncCallback(cb)` / `unregisterAsyncCallback(cb)`

Each callback receives the manager so it can read `deltaTime` / `totalTime`
without closure captures. See `scripts/frame-loop.js` for the three.js-specific
wrapper that exposes `onFrame(cb)`, `startRenderLoop(opts)`, `pauseLoop`,
`resumeLoop`, `resetLoop`.

## Mounting Three.js in a React App

If you must use React, mount three.js imperatively. Do NOT use R3F.

```js
// react component
useEffect(() => {
  const renderer = createRenderer({ canvas: canvasRef.current })
  const scene = createScene()
  const camera = createPerspectiveCamera(aspect)
  const stop = startRenderLoop({ renderer, scene, camera })
  return () => {
    stop()
    disposeScene(scene)
    renderer.dispose()
  }
}, [])
```

State that animates 60fps stays in refs and is mutated directly. Don't lift
transient animation state into React state — drive it through `onFrame` and
mutate refs.

## Composition Pattern

Every scene factory returns:

- `object3D` — the root group to add to the scene
- `tick?` — optional per-frame callback receiving `{ delta, elapsed, frame }`
- `dispose` — cleanup function

```js
// scene/grass-field/index.js
export function createGrassField (options) {
  const geometry = buildGrassGeometry(options)
  const material = createGrassMaterial(options)
  const mesh = new THREE.InstancedMesh(geometry, material, options.count)
  populateInstances(mesh, options)

  return {
    object3D: mesh,
    tick ({ elapsed }) { material.uniforms.uTime.value = elapsed },
    dispose () { geometry.dispose(); material.dispose() }
  }
}
```

The scene composition root collects every feature's `tick` and registers a
single combined callback with the frame loop.

## File Naming

- `kebab-case.js` for all source files.
- `PascalCase.js` only for files that default-export a class.
- `.glsl` extension for standalone shader files (rare — usually inline as
  template literals).
- `.test.js` for unit tests, colocated next to the file under test.

## Dependencies

Minimum viable set:

- `three` (r170+)
- `@tuomashatakka/canvas-loop-framecapper` — frame loop
- `simplex-noise` — procedural noise
- `lil-gui` — dev-only parameter tweaking
- `stats.js` — dev-only FPS panel

Optional:

- `@gltf-transform/cli` — asset optimization pipeline
- `three-mesh-bvh` — fast raycasting against large meshes
- `meshoptimizer` — mesh simplification
- `ai` + `@ai-sdk/google` — LLM-driven codegen
- `zod` — schema validation for LLM outputs
