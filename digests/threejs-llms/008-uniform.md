## Uniform

Uniforms are useful to update values of variables like colors, lighting, or transformations without having to recreate the shader program. They are the true variables from a GPU's point of view.

| Name | Description |
| -- | -- |
| `uniform( boolean \| number \| Color \| Vector2 \| Vector3 \| Vector4 \| Matrix3 \| Matrix4, type = null )` | Dynamic values. |

Example:

```js
const myColor = uniform( new THREE.Color( 0x0066FF ) );

material.colorNode = myColor;
```

### `uniform.on*Update()`

It is also possible to create update events on `uniforms`, which can be defined by the user:

| Name | Description |
| -- | -- |
| `.onObjectUpdate( function )` | It will be updated every time an object like `Mesh` is rendered with this `node` in `Material`. |
| `.onRenderUpdate( function )` | It will be updated once per render, common and shared materials, fog, tone mapping, etc. |
| `.onFrameUpdate( function )` | It will be updated only once per frame, recommended for values ​​that will be updated only once per frame, regardless of when `render-pass` the frame has, cases like `time` for example. |

Example:

```js
const posY = uniform( 0 ); // it's possible use uniform( 'float' )

// or using event to be done automatically
// { object } will be the current rendering object
posY.onObjectUpdate( ( { object } ) => object.position.y );

// you can also update manually using the .value property
posY.value = object.position.y;

material.colorNode = posY;
```
