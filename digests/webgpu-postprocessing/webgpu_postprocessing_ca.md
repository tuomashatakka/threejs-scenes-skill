<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_ca.html via qwen3:4b -->

# Chromatic Aberration

**What it does:** Simulates optical distortion where different colors focus at different points, creating a color fringing effect.

**Renderer / system:** WebGPURenderer + RenderPipeline (TSL nodes)

**Passes / nodes used:**
- `pass` (from `three/tsl`)
- `renderOutput` (from `three/tsl`)
- `chromaticAberration` (from `three/addons/tsl/display/ChromaticAberrationNode.js`)
- `uniform` (from `three/tsl`)

**Key parameters:**
- `strength`: Float (0.5-3) - Intensity of the chromatic aberration effect (higher = more pronounced)
- `center`: Vector2 (x, y) - Center point of the aberration (default: (0.5, 0.5))
- `scale`: Float (0.5-2) - Scale factor for the aberration (higher = larger effect)

**Wiring:**
```ts
const scenePass = pass(scene, camera);
const outputPass = renderOutput(scenePass);
const strengthUniform = uniform(params.strength);
const centerUniform = uniform(new THREE.Vector2(params.center.x, params.center.y));
const scaleUniform = uniform(params.scale);
const caPass = chromaticAberration(outputPass, strengthUniform, centerUniform, scaleUniform);
renderPipeline.outputNode = params.enabled ? caPass : outputPass;
```

**Notes:**
- Requires TSL (Three.js's WebGPU post-processing system) and `RenderPipeline` for WebGPU rendering
- `enabled` parameter toggles effect on/off (default: true)
- Mobile devices may experience performance drops due to WebGPU's higher GPU demands
- WebGPU implementation uses TSL nodes instead of WebGL's EffectComposer
- Effect parameters must be updated via `uniform` nodes for real-time changes
