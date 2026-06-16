# Shaders

Custom GLSL via `ShaderMaterial` and `RawShaderMaterial`.

## Philosophy

Treat shaders as composable units. Each material factory takes typed options and
returns a `ShaderMaterial` with named uniforms. Reuse GLSL chunks (noise, easing,
math helpers) via template literal imports.

## ShaderMaterial vs RawShaderMaterial

- **`ShaderMaterial`** — three.js injects its built-in attributes (`position`,
  `normal`, `uv`), uniforms (`modelMatrix`, `viewMatrix`, `projectionMatrix`,
  `cameraPosition`), and `#define` flags. Use this 95% of the time.
- **`RawShaderMaterial`** — nothing is injected; you write every line. Use only
  when you need full control (e.g. GLSL ES 3.00 with `out` variables, or
  bypassing three's auto-injected boilerplate).

## Standard ShaderMaterial Pattern

See `scripts/holographic-material.js` for a complete example.

```js
const uniforms = {
  uTime:            { value: 0 },
  uBaseColor:       { value: new THREE.Color('#79f7ff') },
  uFresnelStrength: { value: 2 },
  uScanlineDensity: { value: 40 },
}

const material = new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  vertexShader: /* glsl */`
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main () {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * viewMatrix * worldPos;
    }
  `,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec3 uBaseColor;
    uniform float uFresnelStrength, uScanlineDensity;
    varying vec3 vWorldPosition;
    varying vec3 vNormal;
    void main () {
      vec3 viewDir = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), uFresnelStrength);
      float scan = sin(vWorldPosition.y * uScanlineDensity + uTime * 2.0) * 0.5 + 0.5;
      vec3 color = uBaseColor * (scan + 0.5) + uBaseColor * fresnel * 2.0;
      gl_FragColor = vec4(color, fresnel * 0.8);
    }
  `,
})
```

The `/* glsl */` annotation enables syntax highlighting in editors.

## Reusable GLSL Chunks

Keep noise, hash, easing, and color-space helpers as exported template literals
in `src/shaders/chunks/`. Inject them into shader strings.

```js
// src/shaders/chunks/noise.glsl.js
export const valueNoise3 = /* glsl */`
  float hash3 (vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }
  float valueNoise3 (vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash3(i);
    float n100 = hash3(i + vec3(1, 0, 0));
    float n010 = hash3(i + vec3(0, 1, 0));
    float n110 = hash3(i + vec3(1, 1, 0));
    float n001 = hash3(i + vec3(0, 0, 1));
    float n101 = hash3(i + vec3(1, 0, 1));
    float n011 = hash3(i + vec3(0, 1, 1));
    float n111 = hash3(i + vec3(1, 1, 1));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }
`

export const fbm = /* glsl */`
  float fbm (vec3 p, int octaves) {
    float total = 0.0, amp = 0.5, freq = 1.0, norm = 0.0;
    for (int i = 0; i < 8; i++) {
      if (i >= octaves) break;
      total += amp * valueNoise3(p * freq);
      norm += amp;
      amp *= 0.5; freq *= 2.0;
    }
    return total / norm;
  }
`
```

Then compose:

```js
import { valueNoise3, fbm } from '../shaders/chunks/noise.glsl.js'

const fragmentShader = /* glsl */`
  uniform float uTime;
  varying vec3 vWorldPosition;
  ${valueNoise3}
  ${fbm}
  void main () {
    float n = fbm(vWorldPosition * 0.3 + vec3(0.0, uTime * 0.1, 0.0), 4);
    gl_FragColor = vec4(vec3(n), 1.0);
  }
`
```

## Uniforms

- `{ value: ... }` is the required wrapper shape.
- Mutate `uniform.value` directly each frame; no need for `needsUpdate`.
- Three.js auto-converts `Color` / `Vector3` / `Matrix4` to uniform-friendly
  forms.
- For arrays, use `uniform.value = new Float32Array(...)` and declare
  `uniform float uMyArray[16];` in GLSL.

## Modifying Built-In Materials with `onBeforeCompile`

When you want PBR lighting + small custom tweak, don't write a full ShaderMaterial.
Hook `onBeforeCompile` on `MeshStandardMaterial`:

```js
const material = new THREE.MeshStandardMaterial({ color: 0x447777 })
material.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = { value: 0 }
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    /* glsl */`
      #include <begin_vertex>
      transformed.y += sin(position.x * 4.0 + uTime) * 0.1;
    `
  )
  // also need to declare the uniform at the top
  shader.vertexShader = `uniform float uTime;\n` + shader.vertexShader
  material.userData.shader = shader   // keep reference for tick updates
}

// per-frame
if (material.userData.shader) {
  material.userData.shader.uniforms.uTime.value = elapsed
}
```

## Shader Precompilation

The first time three.js renders a new material, it compiles the shader on the
GPU — this can stall ~100ms on complex shaders. Pre-warm:

```js
renderer.compile(scene, camera)
```

Do this after the scene is fully populated but before the first visible frame.

## Common Pitfalls

- Forgetting `transparent: true` when fragment alpha < 1.
- Using `gl_FragColor` in GLSL ES 3.00 — it's `fragColor` (declared as
  `out vec4 fragColor;`). `ShaderMaterial` auto-targets ES 1.00 by default;
  set `glslVersion: THREE.GLSL3` to opt in.
- Uniform name mismatches between JS and GLSL (no error, just silent failure).
- Computing per-fragment work that could be per-vertex (lighting, normal
  transforms when normals don't curve much).
- Sampling a texture in a loop with non-constant index — kills perf and may not
  compile on older drivers.
