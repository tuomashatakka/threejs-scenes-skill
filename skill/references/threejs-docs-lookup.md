# Live three.js docs lookup

Do **not** rely on a bundled copy of the three.js documentation — query the
live, maintained sources instead. three.js publishes its docs in LLM-friendly
plain text and per-page markdown:

| Source | URL | What it is |
| --- | --- | --- |
| Entry point | <https://threejs.org/llms.txt> | Tiny pointer to the two files below |
| Guidelines + curated index | <https://threejs.org/docs/llms.txt> | Modern-pattern instructions for LLMs (importmaps, WebGL vs WebGPU, TSL, NodeMaterials) plus links to the essential API pages |
| Full reference | <https://threejs.org/docs/llms-full.txt> | The guidelines, complete code examples, the **entire TSL specification**, and a catalog of every per-page markdown doc |
| Per-class API page | `https://threejs.org/docs/pages/<Name>.html.md` | Clean markdown for one class, e.g. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html.md) |
| Manual TOC | <https://threejs.org/manual/list.json> | Article paths; read articles at `https://threejs.org/manual/#en/<path>` |

## Query script

`scripts/query-threejs-docs.js` (no dependencies, Node ≥ 18 or Bun) fetches
exactly what a task needs and caches responses for 24 h:

```sh
node scripts/query-threejs-docs.js page InstancedMesh      # one class, as markdown
node scripts/query-threejs-docs.js list bloom              # find page names
node scripts/query-threejs-docs.js sections                # llms-full.txt headings
node scripts/query-threejs-docs.js section render pipeline # one llms-full.txt section
node scripts/query-threejs-docs.js search compute shader   # search pages + full text
node scripts/query-threejs-docs.js manual en/fundamentals  # manual article as text
node scripts/query-threejs-docs.js llms                    # compact LLM guidelines
```

Prefer `page <Name>` for API questions (constructor/properties/methods) and
`section <heading>` for TSL / WebGPU topics — both return focused markdown that
fits comfortably in context. Only fall back to reading `llms-full.txt` whole
when genuinely surveying (it is ~130 kB).

## Topic → live docs map

Which llms-full.txt sections and API pages matter for each area of this skill:

| Skill topic (reference file) | llms-full.txt sections | Key API pages (`docs/pages/<Name>.html.md`) |
| --- | --- | --- |
| Fundamentals (`fundamentals.md`) | *Instructions for Large Language Models*, *Complete Code Examples* | `Object3D`, `BufferGeometry`, `BufferAttribute`, `Mesh`, `Group` — plus manual `en/fundamentals`, `en/scenegraph` |
| Project architecture (`project-architecture.md`) | *Instructions for Large Language Models* (importmap + renderer choice) | `WebGLRenderer`, `Clock` — manual `en/setup`, `en/responsive`, `en/rendering-on-demand` |
| Geometry (`geometry.md`) | — | `ExtrudeGeometry`, `LatheGeometry`, `ShapeGeometry`, `TubeGeometry`, `module-BufferGeometryUtils`, `EdgeSplitModifier` — manual `en/custom-buffergeometry`, `en/primitives` |
| Materials (`materials.md`) | *NodeMaterial*, *MeshStandardNodeMaterial*, *MeshPhysicalNodeMaterial* (WebGPU path) | `MeshStandardMaterial`, `MeshPhysicalMaterial`, `MeshToonMaterial`, `MeshMatcapMaterial`, `ShaderMaterial` — manual `en/materials`, `en/material-table` |
| Textures & maps (`textures-and-maps.md`) | *Texture*, *UV Utils* | `Texture`, `DataTexture`, `TextureLoader`, `CanvasTexture` — manual `en/textures`, `en/canvas-textures` |
| Shaders (`shaders.md`) | *TSL Specification* through *Transitioning common GLSL properties to TSL* (the whole TSL block) | `ShaderMaterial`, `RawShaderMaterial`, `module-UniformsUtils` — manual `en/shadertoy`, `en/debugging-glsl` |
| Lighting (`lighting.md`) | — | `AmbientLight`, `HemisphereLight`, `DirectionalLight`, `SpotLight`, `RectAreaLight`, `LightProbe`, `PMREMGenerator` — manual `en/lights`, `en/shadows` |
| Cameras (`camera-handling.md`) | *Camera* (TSL nodes) | `PerspectiveCamera`, `OrthographicCamera`, `OrbitControls`, `TransformControls` — manual `en/cameras` |
| Instancing (`instancing.md`) | — | `InstancedMesh`, `BatchedMesh`, `InstancedBufferAttribute`, `InstancedBufferGeometry` — manual `en/optimize-lots-of-objects` |
| Particles (`particles.md`) | *Storage*, *Compute* material topics | `Points`, `PointsMaterial`, `GPUComputationRenderer`, `Sprite` |
| Post-processing (`post-processing.md`) | *Render Pipeline*, *Color Adjustments*, *Blend Modes* | `EffectComposer`, `RenderPass`, `ShaderPass`, `UnrealBloomPass`, `OutputPass`, `SMAAPass`, `SSAOPass` — manual `en/post-processing`, `en/webgpu-postprocessing` |
| Animation (`animation-system.md`) | — | `AnimationMixer`, `AnimationClip`, `AnimationAction`, `KeyframeTrack`, `AnimationUtils` — manual `en/animation-system` |
| Loaders / props (`props-and-factories.md`) | — | `GLTFLoader`, `DRACOLoader`, `KTX2Loader`, `LoadingManager`, `Cache` — manual `en/loading-3d-models`, `en/load-gltf` |
| Voxels (`voxel-geometry.md`) | — | `BufferGeometry`, `BufferAttribute` — manual `en/voxel-geometry` |
| Billboards (`billboards.md`) | *SpriteNodeMaterial* | `Sprite`, `SpriteMaterial` — manual `en/billboards` |
| Performance (`performance.md`) | — | `WebGLRenderer` (`info`), `LOD` — manual `en/optimize-lots-of-objects-animated`, `en/offscreencanvas`, `en/cleanup`, `en/how-to-dispose-of-objects` |
| Isometric / infinite (`isometric-and-infinite-scenes.md`) | — | `OrthographicCamera`, `Fog`, `FogExp2` — manual `en/fog` |

Page names are case-sensitive, and addon utility modules carry a `module-`
prefix (`module-BufferGeometryUtils`, `module-SkeletonUtils`, …) — when unsure
run `list <filter>` first. The catalog currently has ~800 pages, including all
`three/addons` classes and the WebGPU/TSL node system.
