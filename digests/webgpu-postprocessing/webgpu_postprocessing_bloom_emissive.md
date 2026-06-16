<!-- ingested from https://threejs.org/examples/webgpu_postprocessing_bloom_emissive.html via qwen3:4b -->

# Bloom Emissive

**What it does:** Applies a bloom effect to emissive materials by first rendering the scene with an emissive pass and then processing the emissive channel with a bloom effect.

**Renderer / system:** WebGPURenderer + RenderPipeline

**Passes / nodes used:**
- `pass` from `three/tsl`
- `mrt` from `three/tsl`
- `output` from `three/tsl`
- `emissive` from `three/tsl`
- `vec4` from `three/tsl`
- `bloom` from `three/addons/tsl/display/BloomNode.js`

**Key parameters:**
- `bloomPass.strength`: Intensity of the bloom effect (0.0 to 5.0)
- `bloomPass.radius`: Blur radius of the bloom effect (0.0 to 1.0)
- `renderer.toneMappingExposure`: Exposure for the tone mapping (0.1 to 2.0)

**Wiring:**
```javascript
const scenePass = pass(scene, camera);
const mrtNode = mrt({ output: output, emissive: vec4(emissive, output.a) });
mrtNode.setBlendMode('emissive', new THREE.BlendMode(THREE.NormalBlending));
scenePass.setMRT(mrtNode);

const emissiveTexture = scenePass.getTexture('emissive');
const bloomPass = bloom(emissiveTexture, 2.5, 0.5);

const outputPass = scenePass.getTextureNode();
const renderPipeline = new THREE.RenderPipeline(renderer);
renderPipeline.outputNode = outputPass.add(bloomPass);
```

**Notes:**
- The emissive texture must be optimized for WebGPU by setting `emissiveTexture.type = THREE.UnsignedByteType` to reduce bandwidth
- This effect is WebGPU-specific; for WebGL use `EffectComposer` + `THREE.Bloom` from `three/examples/jsm/postprocessing`
- Requires emissive materials in the scene (e.g., via emissive materials or emissive textures)
- The `RenderPipeline` is the WebGPU equivalent of the WebGL `EffectComposer` pipeline
- Bloom effect only processes emissive channel (no color channel involvement)
