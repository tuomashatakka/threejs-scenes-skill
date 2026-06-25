## Color Adjustments

Functions for adjusting and manipulating colors.

| Name | Description | Type |
| -- | -- | -- |
| `luminance( node )` | Calculates the luminance (perceived brightness) of a color. | `float` |
| `saturation( node, adjustment = 1 )` | Adjusts the saturation of a color. Values > 1 increase saturation, < 1 decrease. | `color` |
| `vibrance( node, adjustment = 1 )` | Selectively enhances less saturated colors while preserving already saturated ones. | `color` |
| `hue( node, adjustment = 0 )` | Rotates the hue of a color. Value is in radians. | `color` |
| `posterize( node, steps )` | Reduces the number of color levels, creating a poster-like effect. | `color` |

Example:

```js
import { texture, saturation, hue, posterize } from 'three/tsl';

// Increase saturation
material.colorNode = saturation( texture( map ), 1.5 );

// Rotate hue by 90 degrees
material.colorNode = hue( texture( map ), Math.PI / 2 );

// Posterize to 4 color levels
material.colorNode = posterize( texture( map ), 4 );
```
