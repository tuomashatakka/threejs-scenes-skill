## Constants and explicit conversions

Input functions can be used to create contants and do explicit conversions.
> Conversions are also performed automatically if the output and input are of different types.

| Name | Returns a constant or convertion of type: |
| -- | -- |
| `float( node\|number )` | `float` |
| `int( node\|number )` | `int` |
| `uint( node\|number )` | `uint` |
| `bool( node\|value )` | `boolean` |
| `color( node\|hex\|r,g,b )` | `color` |
| `vec2( node\|Vector2\|x,y )` | `vec2` |
| `vec3( node\|Vector3\|x,y,z )` | `vec3` |
| `vec4( node\|Vector4\|x,y,z,w )` | `vec4` |
| `mat2( node\|Matrix2\|a,b,c,d )` | `mat2` |
| `mat3( node\|Matrix3\|a,b,c,d,e,f,g,h,i )` | `mat3` |
| `mat4( node\|Matrix4\|a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p )` | `mat4` |
| `ivec2( node\|x,y )` | `ivec2` |
| `ivec3( node\|x,y,z )` | `ivec3` |
| `ivec4( node\|x,y,z,w )` | `ivec4` |
| `uvec2( node\|x,y )` | `uvec2` |
| `uvec3( node\|x,y,z )` | `uvec3` |
| `uvec4( node\|x,y,z,w )` | `uvec4` |
| `bvec2( node\|x,y )` | `bvec2` |
| `bvec3( node\|x,y,z )` | `bvec3` |
| `bvec4( node\|x,y,z,w )` | `bvec4` |

Example:

```js
import { color, vec2, positionWorld } from 'three/tsl';

// constant
material.colorNode = color( 0x0066ff );

// conversion
material.colorNode = vec2( positionWorld ); // result positionWorld.xy
```
