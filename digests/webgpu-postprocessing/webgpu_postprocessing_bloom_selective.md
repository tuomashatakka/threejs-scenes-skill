<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_bloom_selective.html via qwen3:4b -->

# bloom selective

**What it does:** Selectively applies bloom effects to 3D objects based on per-object bloom intensity uniforms (0 or 1), with adjustable threshold, strength, and radius parameters for the bloom effect.

**Renderer / system:** WebGPURenderer + EffectComposer (via TSL nodes)

**Passes / nodes used:**
- `pass` (from `three/tsl`)
- `mrt` (from `three/tsl`)
- `output` (from `three/tsl`)
- `float` (from `three/tsl`)
- `uniform` (from `three/tsl`)
- `bloom` (from `three/addons/tsl/display/BloomNode.js`)

**Key parameters:**
- `bloomPass.threshold`: [0,1] - Controls brightness threshold for bloom activation
- `bloomPass.strength`: [0,3] - Intensity of bloom effect (higher = more intense)
- `bloomPass.radius`: [0,1] - Blur radius for bloom effect (higher = more spread)
- `bloomIntensity` (per object): 0/1 uniform that toggles bloom activation

**Wiring:**
```javascript
const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({ output, bloomIntensity: float(0) }));
const outputPass = scenePass.getTextureNode().toInspector('Color');
const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity').toInspector('Bloom Intensity');
const bloomPass = bloom(outputPass.mul(bloomIntensityPass));
const renderPipeline = new THREE.RenderPipeline(renderer);
renderPipeline.outputColorTransform = false;
renderPipeline.outputNode = outputPass.add(bloomPass).renderOutput();
```

**Notes:** 
- Requires WebGPURenderer (not WebGL)
- Bloom effect only activates on objects with `bloomIntensity` set to 1
- Per-object bloom intensity toggles via mouse raycasting (intersects with scene)
- Tone mapping must be set to `THREE.NeutralToneMapping` for correct color handling
- Mobile: WebGPU support is limited to modern browsers (no mobile support in current Three.js)
- WebGL vs WebGPU: Uses TSL nodes for WebGPU (WebGL uses `EffectComposer` with shaders)
