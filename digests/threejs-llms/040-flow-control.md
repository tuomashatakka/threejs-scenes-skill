## Flow Control

Functions for controlling shader flow.

| Name | Description |
| -- | -- |
| `Discard()` | Discards the current fragment. |
| `Return()` | Returns from the current function. |
| `Break()` | Breaks out of a loop. |
| `Continue()` | Continues to the next iteration of a loop. |

Example:

```js
import { Fn, If, Discard, uv } from 'three/tsl';

const customFragment = Fn( () => {

	If( uv().x.lessThan( 0.5 ), () => {

		Discard();

	} );

	return vec4( 1, 0, 0, 1 );

} );

material.colorNode = customFragment();
```
