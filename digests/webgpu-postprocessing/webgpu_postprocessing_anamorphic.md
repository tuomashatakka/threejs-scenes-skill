<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_anamorphic.html via qwen3:4b -->

# Anamorphic Postprocessing

**What it does:** Applies an anamorphic distortion effect to the scene, which stretches or compresses the image in a way that mimics perspective distortion for creative visual effects.

**Renderer / system:** WebGPURenderer + RenderPipeline (TSL nodes)

**Passes / nodes used:**
- `ScenePass` (from `three/tsl`)
- `AnamorphicNode` (from `three/addons/tsl/display/AnamorphicNode.js`)

**Key parameters:**
- `threshold`: Controls distortion threshold (default: 1.4). Higher values increase distortion intensity.
- `scaleNode`: Controls distortion scale (default: 5). Higher values increase stretching effect.
- `intensity`: Controls effect strength (default: 1). Higher values amplify distortion.
- `samples`: Number of samples for anamorphic calculation (default: 64). Higher values improve accuracy but increase cost.
- `resolutionScale`: Scales output resolution (default: 0.2). Lower values reduce resolution for performance.

**Wiring:**
```javascript
const scenePass = pass(scene, camera);
const anamorphicPass = anamorphic(
  scenePass.getTextureNode().toInspector('Color'),
  threshold,
  scaleNode,
  samples
).toInspector('Anamorphic');
anamorphicPass.resolutionScale = params.resolutionScale;
const renderPipeline = new THREE.RenderPipeline(renderer);
renderPipeline.outputNode = scenePass.add(anamorphicPass.mul(intensity));
```

**Notes:**
- Designed exclusively for WebGPU (not WebGL). Requires WebGPU hardware support.
- `resolutionScale` reduces resolution for performance (critical on mobile).
- HDR environment is required for optimal results (as used in the example).
- Mobile devices may experience performance drops due to high `samples` (64) and anamorphic calculations.
- WebGPU has stricter memory constraints than WebGL, so resolution scaling is essential for mobile.
