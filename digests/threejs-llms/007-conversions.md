## Conversions

It is also possible to perform conversions using the `method chaining`:

| Name | Returns a constant or conversion of type: |
| -- | -- |
| `.toFloat()` | `float` |
| `.toInt()` | `int` |
| `.toUint()` | `uint` |
| `.toBool()` | `boolean` |
| `.toColor()` | `color` |
| `.toVec2()` | `vec2` |
| `.toVec3()` | `vec3` |
| `.toVec4()` | `vec4` |
| `.toMat2()` | `mat2` |
| `.toMat3()` | `mat3` |
| `.toMat4()` | `mat4` |
| | |
| `.toIVec2()` | `ivec2` |
| `.toIVec3()` | `ivec3` |
| `.toIVec4()` | `ivec4` |
| `.toUVec2()` | `uvec2` |
| `.toUVec3()` | `uvec3` |
| `.toUVec4()` | `uvec4` |
| `.toBVec2()` | `bvec2` |
| `.toBVec3()` | `bvec3` |
| `.toBVec4()` | `bvec4` |

Example:

```js
import { positionWorld } from 'three/tsl';

// conversion
material.colorNode = positionWorld.toVec2(); // result positionWorld.xy
```
