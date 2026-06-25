## Varying

Functions used to declare varying.

| Name | Description |
| -- | -- |
| `vertexStage( node )` | Computes the node in the vertex stage. |
| `varying( node, name = null )` | Computes the node in the vertex stage and passes interpolated values to the fragment shader. |
| `varyingProperty( type, name = null )` | Declares an varying property but does not assign an initial value. |

Let's suppose you want to optimize some calculation in the `vertex stage` but are using it in a slot like `material.colorNode`.

For example:

```js
// multiplication will be executed in vertex stage
const normalView = vertexStage( modelNormalMatrix.mul( normalLocal ) );

// normalize will be computed in fragment stage while `normalView` is computed on vertex stage
material.colorNode = normalView.normalize();
```

The first parameter of `vertexStage()` `modelNormalMatrix.mul( normalLocal )` will be computed in `vertex stage`, and the return from `vertexStage()` will be a `varying` as we are used in WGSL/GLSL, this can optimize extra calculations in the `fragment stage`. The second parameter of `varying()` allows you to add a custom name in code generation.

If `varying()` is added only to `material.positionNode`, it will only return a simple variable and varying will not be created because `material.positionNode` is one of the only node material input that are computed at the vertex stage.
