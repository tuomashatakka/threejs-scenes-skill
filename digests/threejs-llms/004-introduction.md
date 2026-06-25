## Introduction

### Why TSL?

Creating shaders has always been an advanced step for most developers; many game developers have never created GLSL code from scratch. The shader graph solution adopted today by the industry has allowed developers more focused on dynamics to create the necessary graphic effects to meet the demands of their projects.

The aim of the project is to create an easy-to-use environment for shader creation. Even if for this we need to create complexity behind it, this happened initially with `Renderer` and now with the `TSL`.

Other benefits that TSL brings besides simplifying shading creation are keeping the `renderer agnostic`, while all the complexity of a material can be imported into different modules and use `tree shaking` without breaking during the process.

### Example

A `detail map` makes things look more real in games. It adds tiny details like cracks or bumps to surfaces. In this example we will scale uv to improve details when seen up close and multiply with a base texture.

#### Old

This is how we would achieve that using `.onBeforeCompile()`:

```js
const material = new THREE.MeshStandardMaterial();
material.map = colorMap;
material.onBeforeCompile = ( shader ) => {

	shader.uniforms.detailMap = { value: detailMap };

	let token = '#define STANDARD';

	let insert = /* glsl */`
		uniform sampler2D detailMap;
	`;

	shader.fragmentShader = shader.fragmentShader.replace( token, token + insert );

	token = '#include <map_fragment>';

	insert = /* glsl */`
		diffuseColor *= texture2D( detailMap, vMapUv * 10.0 );
	`;

	shader.fragmentShader = shader.fragmentShader.replace( token, token + insert );

};
```

Any simple change from this makes the code increasingly complicated using `.onBeforeCompile`, the result we have today in the community are countless types of parametric materials that do not communicate with each other, and that need to be updated periodically to be operating, limiting the creativity to create unique materials reusing modules in a simple way.

#### New

With `TSL` the code would look like this:

```js
import { texture, uv } from 'three/tsl';

const detail = texture( detailMap, uv().mul( 10 ) );

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = texture( colorMap ).mul( detail );
```

`TSL` is also capable of encoding code into different outputs such as `WGSL`/`GLSL` - `WebGPU`/`WebGL`, in addition to optimizing the shader graph automatically and through codes that can be inserted within each `Node`. This allows the developer to focus on productivity and leave the graphical management part to the `Node System`.

Another important feature of a graph shader is that we will no longer need to care about the sequence in which components are created, because the `Node System` will only declare and include it once.

Let's say that you import `positionWorld` into your code, even if another component uses it, the calculations performed to obtain `position world` will only be performed once, as is the case with any other node such as: `normalWorld`, `modelPosition`, etc.

### Architecture

All `TSL` components are extended from `Node` class. The `Node` allows it to communicate with any other, value conversions can be automatic or manual, a `Node` can receive the output value expected by the parent `Node` and modify its own output snippet. It's possible to modulate them using `tree shaking` in the shader construction process, the `Node` will have important information such as `geometry`, `material`, `renderer` as well as the `backend`, which can influence the type and value of output.

The main class responsible for creating the code is `NodeBuilder`. This class can be extended to any output programming language, so you can use TSL for a third language if you wish. Currently `NodeBuilder` has two extended classes, the `WGSLNodeBuilder` aimed at WebGPU and `GLSLNodeBuilder` aimed at WebGL2.

The build process is based on three pillars: `setup`, `analyze` and `generate`.

| | |
| -- | -- |
| `setup` | Use `TSL` to create a completely customized code for the `Node` output. The `Node` can use many others within itself, have countless inputs, but there will always be a single output. |
| `analyze` | This proccess will check the `nodes` that were created in order to create useful information for `generate` the snippet, such as the need to create or not a cache/variable for optimizing a node. |
| `generate` | An output of `string` will be returned from each `node`. Any node will also be able to create code in the flow of shader, supporting multiple lines. |

`Node` also have a native update process invoked by the `update()` function, these events be called by `frame`, `render call` and `object draw`.

It is also possible to serialize or deserialize a `Node` using `serialize()` and `deserialize()` functions.
