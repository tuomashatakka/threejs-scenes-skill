## Utilities

Utility functions for common shader tasks.

| Name | Description | Type |
| -- | -- | -- |
| `billboarding( { position, horizontal, vertical } )` | Orients flat meshes always towards the camera. `position`: vertex positions in world space (default: `null`). `horizontal`: follow camera horizontally (default: `true`). `vertical`: follow camera vertically (default: `false`). | `vec3` |
| `checker( coord )` | Creates a 2x2 checkerboard pattern. | `float` |

Example:

```js
import { billboarding } from 'three/tsl';

// Default: Horizontal only (like trees) - rotates around Y axis only
material.vertexNode = billboarding();

// Full billboarding (like particles) - faces camera in all directions
material.vertexNode = billboarding( { horizontal: true, vertical: true } );
```
