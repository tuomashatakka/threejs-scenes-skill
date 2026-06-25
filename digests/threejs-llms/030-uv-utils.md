## UV Utils

| Name | Description | Type |
| -- | -- | -- |
| `matcapUV` | UV coordinates for matcap texture. | `vec2` |
| `rotateUV( uv, rotation, centerNode = vec2( 0.5 ) )` | Rotates UV coordinates around a center point. | `vec2` |
| `spherizeUV( uv, strength, centerNode = vec2( 0.5 ) )` | Distorts UV coordinates with a spherical effect around a center point. | `vec2` |
| `spritesheetUV( count, uv = uv(), frame = float( 0 ) )` | Computes UV coordinates for a sprite sheet based on the number of frames, UV coordinates, and frame index. | `vec2` |
| `equirectUV( direction = positionWorldDirection )` | Computes UV coordinates for equirectangular mapping based on the direction vector. | `vec2` |

```js
import { texture, matcapUV } from 'three/tsl';

const matcap = texture( matcapMap, matcapUV );
```
