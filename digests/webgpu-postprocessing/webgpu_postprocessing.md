<!-- ingested from https://threejs.org/examples/webgpu_postprocessing.html via qwen3:4b -->

# DotScreen with RGB Shift

**What it does:** Applies a dot screen pattern to the scene and then shifts the color by a small amount.

**Renderer / system:** WebGPURenderer + RenderPipeline (TSL nodes)

**Passes / nodes used:**
- `ScenePass` (from `three/tsl`)
- `DotScreenNode` (from `three/addons/tsl/display/DotScreenNode.js`)
- `RGBShiftNode` (from `three/addons/tsl/display/RGBShiftNode.js`)

**Key parameters:**
- `dotScreenPass.scale.value`: controls the dot pattern size (default: 0.3)
- `rgbShiftPass.amount.value`: controls the color shift amount (default: 0.001)

```javascript
const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode();
const dotScreenPass = dotScreen(scenePassColor);
dotScreenPass.scale.value = 0.3;
const rgbShiftPass = rgbShift(dotScreenPass);
rgbShiftPass.amount.value = 0.001;
renderPipeline.outputNode = rgbShiftPass;
```

**Notes:** 
This effect requires WebGPU. WebGPU is not supported on all mobile devices. The `RenderPipeline` class is used for WebGPU postprocessing (not compatible with WebGL's `EffectComposer`). The `toInspector` call in the original example is for debugging only and not part of the core effect wiring.
