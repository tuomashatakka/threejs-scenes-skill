## Struct

Structs allow you to create custom data types with multiple members. They can be used to organize related data in shaders, define structures for attributes and uniforms.

| Name | Description |
| -- | -- |
| `struct( membersLayout, name = null )` | Creates a struct type with the specified member layout. |
| `outputStruct( ...members )` | Creates an output struct node for returning multiple values. |

Example:

```js
import { struct, vec3 } from 'three/tsl';

// Define a custom struct
const BoundingBox = struct( { min: 'vec3', max: 'vec3' } );

// Create a new instance of the struct
const bb = BoundingBox( vec3( 0 ), vec3( 1 ) ); // style 1
const bb2 = BoundingBox( { min: vec3( 0 ), max: vec3( 1 ) } ); // style 2

// Access the struct members
const min = bb.get( 'min' );

// Assign a new value to a member
min.assign( vec3( -1, -1, -1 ) );
```
