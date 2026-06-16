<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_3dlut.html via qwen3:4b -->

# 3D LUTs

**What it does:** Applies a 3D color lookup table (LUT) to the rendered scene for color grading or correction.

**Renderer / system:** WebGPURenderer + PostProcessing (TSL nodes)

**Passes / nodes used:**
- `pass` (from `three/tsl`)
- `renderOutput` (from `three/tsl`)
- `lut3D` (from `three/addons/tsl/display/Lut3DNode.js`)
- `texture3D` (from `three/tsl`)
- `uniform` (from `three/tsl`)

**Key parameters:**
- `lut`: String name of the LUT (e.g., `'Bourbon 64.CUBE'`) selected from a predefined list
- `intensity`: Float between 0 and 1 controlling the strength of the LUT effect

**Wiring:**
```ts
const scenePass = pass(scene, camera);
const outputPass = renderOutput(scenePass);
const lutPass = lut3D(outputPass, texture3D(lutTexture), lutTexture.image.width, uniform(1));
renderPipeline.outputNode = lutPass;
```

**Notes:**
- Requires WebGPU (not WebGL)
- LUTs must be loaded asynchronously using `LUTCubeLoader`, `LUT3dlLoader`, or `LUTImageLoader`
- The `lut3D` node expects a 3D texture and its width in pixels
- `intensity` parameter scales the LUT effect (0 = no effect, 1 = full effect)
- Mobile WebGPU support is limited to iOS/Android devices with specific hardware capabilities
