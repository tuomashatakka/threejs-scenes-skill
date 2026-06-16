# Particles

Particle systems without WebGPU compute shaders.

## Sizing Strategy

| Count | Approach | File |
|-------|----------|------|
| < 10k | `Points` with dynamic `BufferAttribute`, CPU updates per frame | `scripts/cpu-particles.js` |
| 10k–100k | `InstancedMesh` of a billboard quad with per-instance attributes | `scripts/cpu-particles.js` (instanced variant) |
| 100k–1M+ | GPGPU ping-pong via `GPUComputationRenderer` from `three/addons` | see "GPGPU" below |

## CPU Instanced (10k–100k)

For mid-scale fields (dust motes, embers, falling leaves), use `InstancedMesh`
with a billboard plane geometry and per-instance attributes (position, age,
velocity). Update positions in JS each frame and write back via
`instanceMatrix.needsUpdate = true`.

This stays performant because the GPU work per particle is just a textured
quad. The bottleneck becomes the per-frame matrix upload — keep the count under
~50k for 60fps on mobile.

## GPGPU Ping-Pong (100k+)

`GPUComputationRenderer` simulates particle physics by rendering to a
`WebGLRenderTarget` whose pixels hold position/velocity data. Each frame:

1. Read the previous frame's render target as input texture.
2. Run a fragment shader that updates position/velocity per fragment (one
   fragment = one particle).
3. Write the result to a new render target.
4. Swap.

Then a regular `Points` material samples the position texture in its vertex
shader to place each point.

```js
import { GPUComputationRenderer } from 'three/addons/misc/GPUComputationRenderer.js'

const width = 512   // 512×512 = 262144 particles
const gpgpu = new GPUComputationRenderer(width, width, renderer)

const positionTexture = gpgpu.createTexture()
const velocityTexture = gpgpu.createTexture()

// seed position texture with initial values
const posArray = positionTexture.image.data
for (let i = 0; i < posArray.length; i += 4) {
  posArray[i + 0] = (Math.random() - 0.5) * 10   // x
  posArray[i + 1] = (Math.random() - 0.5) * 10   // y
  posArray[i + 2] = (Math.random() - 0.5) * 10   // z
  posArray[i + 3] = 1                              // life
}

const positionVar = gpgpu.addVariable('texturePosition', positionFragmentShader, positionTexture)
const velocityVar = gpgpu.addVariable('textureVelocity', velocityFragmentShader, velocityTexture)
gpgpu.setVariableDependencies(positionVar, [positionVar, velocityVar])
gpgpu.setVariableDependencies(velocityVar, [positionVar, velocityVar])

positionVar.material.uniforms.uTime = { value: 0 }
velocityVar.material.uniforms.uTime = { value: 0 }

const err = gpgpu.init()
if (err !== null) console.error(err)

// each frame
positionVar.material.uniforms.uTime.value = elapsed
gpgpu.compute()
pointsMaterial.uniforms.uPositionTexture.value = gpgpu.getCurrentRenderTarget(positionVar).texture
```

The render `Points` material then samples that position texture:

```glsl
// vertex
uniform sampler2D uPositionTexture;
attribute vec2 aRef;   // particle's UV in the position texture
void main () {
  vec3 pos = texture2D(uPositionTexture, aRef).xyz;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = 4.0 * (1.0 / -mv.z);
}
```

## Sprite Rendering Tips

- Disable `depthWrite`, keep `depthTest` on for soft sort.
- `AdditiveBlending` for sparks/embers; `NormalBlending` with premultiplied
  alpha for smoke/clouds.
- Sort back-to-front only when truly translucent and depth-fighting; sorting
  kills perf on huge counts.
- Use a 1-channel alpha texture or signed-distance-field sprite to avoid
  sampler bandwidth.

## Pre-Computed Behavior

If particle motion is deterministic (linear trajectories, gravity), compute the
entire flight in the vertex shader from `aBirthTime`, `aLifetime`, `aVelocity`
attributes:

```glsl
attribute vec3 aSpawnPos;
attribute vec3 aVelocity;
attribute float aBirthTime;
uniform float uTime;
void main () {
  float age = uTime - aBirthTime;
  vec3 pos = aSpawnPos + aVelocity * age + vec3(0.0, -4.9, 0.0) * age * age;
  gl_Position = projectionMatrix * viewMatrix * vec4(pos, 1.0);
}
```

This needs zero per-frame JS work — set the attributes once, animate via
`uTime`. Cheapest particle pattern in three.js.

## Common Pitfalls

- Writing `attribute.needsUpdate = true` for every frame on a huge buffer —
  uploads the entire array every frame. Use partial updates via
  `attribute.updateRange.offset` / `.count`.
- Using `Sprite` (not `Points` / `InstancedMesh`) for 10k+ particles — each
  `Sprite` is one draw call.
- Forgetting `depthWrite: false` on transparent particles — they occlude
  themselves and cause visual sorting bugs.
- Computing `Math.random()` per particle per frame on the CPU — pre-bake
  randomness into attributes once.
