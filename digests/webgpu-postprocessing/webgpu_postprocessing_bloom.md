<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_bloom.html via qwen3:4b -->

# Bloom

**What it does:** Enhances bright areas in the scene by creating a glow effect through luminance-based postprocessing.

**Renderer / system:** WebGPURenderer + RenderPipeline

**Passes / nodes used:**
- `pass`: from `three/tsl`
- `bloom`: from `three/addons/tsl/display/BloomNode.js`

**Key parameters:**
- `threshold`: [0, 1] - minimum brightness to trigger bloom effect
- `strength`: [0, 3] - intensity of the glow effect
- `radius`: [0, 1] - spread of the bloom (in pixels)
- `exposure`: [0.1, 2] - tone mapping exposure (applied separately via `renderer.toneMappingExposure`)

**Wiring:**
```javascript
const scenePass = pass(scene, camera);
const scenePassColor = scenePass.getTextureNode('output').toInspector('Color');
const bloomPass = bloom(scenePassColor).toInspector('Bloom');
renderPipeline.outputNode = scenePassColor.add(bloomPass);
```

**Notes:**  
- Bloom effect is computationally heavy and may cause performance issues on mobile devices (WebGPU not supported on all mobile browsers)  
- `exposure` parameter affects tone mapping (not the bloom effect itself)  
- WebGPU implementation uses TSL nodes instead of WebGL's ShaderMaterial-based effects  
- Requires `three/webgpu` renderer and `three/addons/tsl` module for WebGPU compatibility
