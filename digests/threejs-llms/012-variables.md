## Variables

Functions used to declare variables.

| Name | Description |
| -- | -- |
| `.toVar( node, name = null )` or `Var( node, name = null )` | Converts a node into a reusable variable in the shader. |
| `.toConst( node, name = null )` or `Const( node, name = null )` | Converts a node into an inline constant. |
| `property( type, name = null )` | Declares an property but does not assign an initial value. |

The name is optional; if set to `null`, the node system will generate one automatically.  
Creating a variable, constant, or property can help optimize the shader graph manually or assist in debugging.

```js
const uvScaled = uv().mul( 10 ).toVar();

material.colorNode = texture( map, uvScaled );
```

***
