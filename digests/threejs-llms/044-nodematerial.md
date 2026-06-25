## NodeMaterial

Check below for more details about `NodeMaterial` inputs.

#### Core

| Name | Description | Type |
|--|--|--|
| `.fragmentNode` | Replaces the built-in material logic used in the fragment stage. | `vec4` |
| `.vertexNode` | Replaces the built-in material logic used in the vertex stage. | `vec4` |
| `.geometryNode` | Allows you to execute a TSL function to deal with Geometry. | `Fn()` |

#### Basic

| Name | Description | Reference | Type |
|--|--|--|--|
| `.colorNode` | Replace the logic of `material.color * material.map`. | `materialColor` | `vec4` |
| `.depthNode` | Customize the `depth` output. | `depth` | `float` |
| `.opacityNode` | Replace the logic of `material.opacity * material.alphaMap`. | `materialOpacity` | `float` |
| `.alphaTestNode` | Sets a threshold to discard pixels with low opacity. | `materialAlphaTest` | `float` |
| `.positionNode` | Represents the vertex positions in local-space. Replace the logic of `material.displacementMap * material.displacementScale + material.displacementBias`. | `positionLocal` | `vec3` |

#### Lighting

| Name | Description | Reference | Type |
|--|--|--|--|
| `.emissiveNode` | Replace the logic of `material.emissive * material.emissiveIntensity * material.emissiveMap`. | `materialEmissive` | `color` |
| `.normalNode` | Represents the normals direction in view-space. Replace the logic of `material.normalMap * material.normalScale` and `material.bumpMap * material.bumpScale`. | `materialNormal` | `vec3` |
| `.lightsNode` | Defines the lights and lighting model that will be used by the material. |  | `lights()` |
| `.envNode` | Replace the logic of `material.envMap * material.envMapRotation * material.envMapIntensity`. |  | `color` |

#### Backdrop

| Name | Description | Type |
|--|--|--|
| `.backdropNode` | Set the current render color to be used before applying `Specular`, useful for `transmission` and `refraction` effects. | `color` |
| `.backdropAlphaNode` | Define the alpha of `backdropNode`. | `float` |

#### Shadows

| Name | Description | Reference | Type |
|--|--|--|--|
| `.castShadowNode` | Control the `color` and `opacity` of the shadow that will be projected by the material. |  | `vec4` |
| `.maskShadowNode` | Define a custom mask for the shadow. |  | `bool` |
| `.receivedShadowNode` | Handle the shadow cast on the material. |  | `Fn()` |
| `.receivedShadowPositionNode` | Define the shadow projection position in world-space. | `shadowPositionWorld` | `vec3` |
| `.aoNode` | Replace the logic of `material.aoMap * aoMapIntensity`. | `materialAO` | `float` |

#### Output

| Name | Description | Reference | Type |
|--|--|--|--|
| `.maskNode` | Define the material's mask. Unlike opacity, it is discarded at the beginning of rendering, optimizing the process. |  | `bool` |
| `.mrtNode` | Define a different MRT than the one defined in `pass()`. |  | `mrt()` |
| `.outputNode` | Defines the material's final output. | `output` | `vec4` |
