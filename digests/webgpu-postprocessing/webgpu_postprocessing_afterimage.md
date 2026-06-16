<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_afterimage.html via qwen3:4b -->

# Afterimage

**What it does:** Creates a motion blur effect by blending the current frame with a previous frame (damped) to simulate afterimages.

**Renderer / system:** WebGPURenderer + PostProcessing (TSL nodes)

**Passes / nodes used:**
- `scenePass`: TSL pass (from `three/tsl`)
- `afterImage`: AfterImageNode TSL node (from `three/addons/tsl/display/AfterImageNode.js`)

**Key parameters:**
- `damp`: Float uniform (0.25 to 1.0) controlling the damping (how much the afterimage fades). Higher values mean less fading (more afterimage).

**Wiring:**
```javascript
const renderPipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
const afterImagePass = afterImage(scenePass, 0.8);
renderPipeline.outputNode = afterImagePass;
```

**Notes:**
- The effect is toggled via the `enabled` parameter (default: true). When disabled, the output reverts to `scenePass`.
- WebGPU is not supported on mobile devices.
- The `damp` parameter must be between 0.25 and 1.0 for the effect to work as intended.
