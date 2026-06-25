## Transitioning common GLSL properties to TSL

| GLSL | TSL | Type |
| -- | -- | -- |
| `position` | `positionGeometry` | `vec3` |
| `transformed` | `positionLocal` | `vec3` |
| `transformedNormal` | `normalLocal` | `vec3` |
| `vWorldPosition` | `positionWorld` | `vec3` |
| `vColor` | `vertexColor()` | `vec3` |
| `vUv` \| `uv` | `uv()` | `vec2` |
| `vNormal` | `normalView` | `vec3` |
| `viewMatrix` | `cameraViewMatrix` | `mat4` |
| `modelMatrix` | `modelWorldMatrix` | `mat4` |
| `modelViewMatrix` | `modelViewMatrix` | `mat4` |
| `projectionMatrix` | `cameraProjectionMatrix` | `mat4` |
| `diffuseColor` | `material.colorNode` | `vec4` |
| `gl_FragColor` | `material.fragmentNode` | `vec4` |



---
