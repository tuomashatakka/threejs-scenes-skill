# Fundamentals — three.js primitives & scene building blocks

Distilled from the [three.js manual](https://threejs.org/manual/) fundamentals
chapters, mapped onto this library's modules. Read this when you need the
*conceptual* model behind a feature; read the per-module reference for the API.
For the upstream source, query the live docs — `node scripts/query-threejs-docs.js
manual en/<chapter>` or `page <ClassName>` (see [threejs-docs-lookup.md](./threejs-docs-lookup.md)).

| Manual chapter | What to know | In this library |
| --- | --- | --- |
| [Fundamentals](https://threejs.org/manual/#en/fundamentals) | The mandatory quartet: `Renderer` + `Scene` + `Camera` + a render loop. Mesh = `Geometry` + `Material`. Lights affect only lights-responsive materials. | `core` — [project-architecture.md](./project-architecture.md). `bootstrapScene` wires all four. |
| [Primitives](https://threejs.org/manual/#en/primitives) | Built-in geometries: Box, Sphere, Cylinder, Cone, Torus, TorusKnot, Plane, Circle, Ring, Dodeca/Icosa/Octa/Tetrahedron, Lathe, Extrude, Shape, Tube, Edges, Wireframe, Text. Reuse ONE geometry across many meshes. | `geometry` — [geometry.md](./geometry.md) wraps Extrude/Lathe/Shape + modifiers. `props` — [props-and-factories.md](./props-and-factories.md) bundles primitives into reusable props. |
| [Scenegraph](https://threejs.org/manual/#en/scenegraph) | The scene is a tree; each node's transform is relative to its parent. Use `Group`/`Object3D` pivots for orbits, turrets, solar systems. `updateMatrixWorld` flows top-down. | `geometry` `createGroup`/`layoutGrid`/`layoutRadial`; `architecture` `pickTopLevel` walks the tree to the owning module. |
| [Materials](https://threejs.org/manual/#en/materials) | `MeshBasic` (unlit) → `MeshLambert`/`MeshPhong` (cheap lit) → `MeshStandard`/`MeshPhysical` (PBR: roughness/metalness) → `MeshToon`/`MeshMatcap` (stylized). Share material instances; tone-map once. | `materials` — [materials.md](./materials.md): `createStandardMaterial` presets, toon, matcap, holographic. `architecture` `MaterialPool` owns sharing + disposal. |
| [Textures](https://threejs.org/manual/#en/textures) | UV-mapped images: `map`, `normalMap`, `roughnessMap`, `aoMap`, `emissiveMap`. Mind `colorSpace` (SRGB for color maps, NoColorSpace for data), `wrapS/T`, `repeat`, mipmaps, anisotropy. Loading is async. | `procedural` `createNoiseTexture`; `architecture` `createProceduralTexture` cache — [textures-and-maps.md](./textures-and-maps.md). |
| [Lights](https://threejs.org/manual/#en/lights) | Ambient/Hemisphere (fill) · Directional (sun, parallel) · Point (bulb) · Spot · RectArea. Lights cost real GPU time — prefer an IBL environment + one key light over many dynamic lights. | `lighting` — [lighting.md](./lighting.md): `setupStandardLighting` = IBL env + sun + hemisphere. |
| [Cameras](https://threejs.org/manual/#en/cameras) | `PerspectiveCamera(fov, aspect, near, far)` for 3D depth; `OrthographicCamera` for iso/2D/HUD. Keep the near/far range tight to preserve depth precision. | `camera` — [camera-handling.md](./camera-handling.md): `createIsoCamera` (ortho), `createFollowCamera`. |
| [Shadows](https://threejs.org/manual/#en/shadows) | Shadow maps: enable `renderer.shadowMap`, set `castShadow`/`receiveShadow`, size the light's shadow *camera frustum* to the scene. Tune `bias`/`normalBias` to kill acne & peter-panning. | `lighting` `createSun` ships a tuned shadow frustum + bias defaults. |
| [Fog](https://threejs.org/manual/#en/fog) | `Fog` (linear near/far) or `FogExp2` (exponential density) fades distance to a color — match the fog color to the scene background. Cheap depth cue for infinite/voxel worlds. | Set `scene.fog`; pairs with `voxels` `createChunkManager` view radius and the follow-camera demo. |
| [Render Targets](https://threejs.org/manual/#en/rendertargets) | Render into a `WebGLRenderTarget` texture instead of the screen — the basis of post-processing, mirrors, portals, picking, and depth/normal capture. Attach a `DepthTexture` to read scene depth. | `post` — [post-processing.md](./post-processing.md): `createComposer` binds a DepthTexture so DOF/god-rays sample depth (see `public/demos/dof.html`). |
| [Custom BufferGeometry](https://threejs.org/manual/#en/custom-buffergeometry) | Author `position`/`normal`/`uv`/`color` `BufferAttribute`s directly; index to share vertices. Recompute normals after deforming. The escape hatch when no primitive fits. | `geometry` `displaceByNoise`/`recomputeNormals`/`mergeGeometryList`; `voxels` `greedyMesh` builds geometry from scratch — [voxel-geometry.md](./voxel-geometry.md). |
| [Physics](https://threejs.org/manual/#en/physics) | three.js has NO physics engine — bolt on Rapier/Cannon/Ammo. The pattern: step the physics world each frame, copy body transforms onto the matching `Object3D`s. Keep render and sim decoupled. | Drive bodies from the `core` frame loop (`onFrame`); apply results to props from [props-and-factories.md](./props-and-factories.md). |

## The minimum every scene needs

```js
import { bootstrapScene } from '@scenes'

bootstrapScene({
  canvas,
  onSetup ({ scene, camera, renderer }) {
    // 1. primitives + materials → meshes        (Primitives, Materials)
    // 2. parent into Groups for relative motion  (Scenegraph)
    // 3. setupStandardLighting(scene, renderer)  (Lights, Shadows)
    // 4. scene.fog for depth falloff             (Fog)
    return ({ delta }) => { /* per-frame */ }
  },
})
```

## Cross-references

- API for code-built geometry: [geometry.md](./geometry.md)
- Reusable prop definitions: [props-and-factories.md](./props-and-factories.md)
- Material starting points: [materials.md](./materials.md)
- Texture/UV detail: [textures-and-maps.md](./textures-and-maps.md)
- Lighting rig: [lighting.md](./lighting.md) · Cameras: [camera-handling.md](./camera-handling.md)
- Render targets in practice: [post-processing.md](./post-processing.md)
- Scratch-built geometry at scale: [voxel-geometry.md](./voxel-geometry.md)
