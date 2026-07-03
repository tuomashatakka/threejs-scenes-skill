# Billboards

Camera-facing planes for sprites, trees, particles, markers.

## When to Use Each

- **`THREE.Sprite`** (built-in) — easy. Each sprite faces the camera, scales in
  screen space. Cost: one draw call per sprite unless batched. Use for < 100
  sprites or simple UI markers.
- **Shader-based quad billboard on `InstancedMesh`** — fastest. One draw call
  for 100k+ billboards. Use for grass, foliage cards, particle quads,
  far-distance decoration. See `scripts/sprite-batch.js`.
- **`THREE.Points`** with a sprite texture — cheapest for tiny dots / stars /
  spark particles. Limited control over per-particle rotation.
- **Cylindrical billboard** (y-axis only) for trees/grass.
- **Spherical billboard** for UI markers and foliage cards that should always
  face the camera fully.

## GLSL Billboarding Math

The trick: in the vertex shader, take the instance center in world space,
build right/up vectors orthogonal to the camera-to-instance direction, then
offset the local quad vertex along those axes.

```glsl
// vertex shader, spherical billboard, applied to a unit PlaneGeometry
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
attribute vec3 position;
attribute vec3 aInstancePos;    // per-instance center
attribute vec2 aInstanceScale;  // per-instance width/height
varying vec2 vUv;

void main () {
  vUv = position.xy + 0.5;
  // billboard offset in view space
  vec3 viewCenter = (modelViewMatrix * vec4(aInstancePos, 1.0)).xyz;
  vec3 offset = vec3(position.x * aInstanceScale.x, position.y * aInstanceScale.y, 0.0);
  vec3 viewPos = viewCenter + offset;
  gl_Position = projectionMatrix * vec4(viewPos, 1.0);
}
```

For cylindrical (y-axis only), zero out the view-space y component of the
offset's basis vectors and use world `up = (0, 1, 0)` for the up axis.

## Distance Fade

Fade billboards to alpha 0 near + far to avoid abrupt pop. Compute `smoothstep`
on `length(cameraPosition - instancePos)` inside the fragment shader:

```glsl
uniform float uNearFade, uFarFade;
varying float vDistance;

float fade = smoothstep(uNearFade - 1.0, uNearFade, vDistance)
           * (1.0 - smoothstep(uFarFade - 5.0, uFarFade, vDistance));
gl_FragColor.a *= fade;
```

## Atlas Sprites

For multiple sprite variants in one batch, pack into a texture atlas and use
a `aSpriteIndex` per-instance attribute to compute the atlas UV in the
fragment shader (same pattern as voxel atlasing — see
`references/voxel-geometry.md`).

## Soft Particles

Hard quad edges look bad against scene geometry. Soft particles fade alpha
based on the depth difference between the quad fragment and the scene behind
it:

```glsl
uniform sampler2D uSceneDepth;
uniform float uSoftness;
uniform vec2 uResolution;

float sceneDepth = texture2D(uSceneDepth, gl_FragCoord.xy / uResolution).r;
float quadDepth = gl_FragCoord.z;
float diff = (sceneDepth - quadDepth) * uSoftness;
gl_FragColor.a *= smoothstep(0.0, 1.0, diff);
```

Needs `DepthTexture` bound on the main render target.

## Common Pitfalls

- Using `Sprite` for 10k+ markers — each is a draw call, FPS dies.
- Forgetting `transparent: true` on the billboard material — alpha cutoff
  breaks soft edges.
- `depthWrite: true` on alpha-blended billboards — they occlude each other
  weirdly; turn it off.
- Sorting issues with many overlapping translucent sprites — sort the
  `InstancedMesh` instance buffer back-to-front each frame (expensive but
  fixes it) or accept the bug for foliage where it doesn't matter.
- Billboard math computed in JS each frame via `lookAt` — slow for high
  counts; do it in the shader.

## Live three.js docs

- API pages: [Sprite](https://threejs.org/docs/pages/Sprite.html.md), [SpriteMaterial](https://threejs.org/docs/pages/SpriteMaterial.html.md).
- Manual: `node scripts/query-threejs-docs.js manual en/billboards`. Lookup guide: [threejs-docs-lookup.md](./threejs-docs-lookup.md).
