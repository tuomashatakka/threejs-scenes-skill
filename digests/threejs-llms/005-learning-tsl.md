## Learning TSL

TSL is a Node-based shader abstraction, written in JavaScript. TSL's functions are inspired by GLSL, but follow a very different concept. WGSL and GLSL are focused on creating GPU programs, in TSL this is one of the features.

### Seamless Integration with JavaScript/TypeScript

- Unified Code
  - Write shader logic directly in JS/TS, eliminating the need to manipulate strings.
  - Create and manipulate render objects just like any other JavaScript logic inside a TSL function.
  - Advanced events to control a Node before and after the object is rendered.
- JS Ecosystem
  - Use native **import/export**, **NPM**, and integrate **JS/TS** components directly into your shader logic.
- Typing
  - Benefit from better type checking (especially with **TypeScript** and **[@three-types](https://github.com/three-types/three-ts-types)**), increasing code robustness.

### Shader-Graph Inspired Structure

- Focus on Intent
  - Build materials by connecting nodes through: [positionWorld](#position), [normalWorld](#normal), [screenUV](#screen), [attribute()](#attributes), etc. 
More declarative("what") vs. imperative("how").
- Composition & High-Level Concepts
  - Work with high-level concepts for Node Material like [colorNode](#basic), [roughnessNode](#standard), [metalnessNode](#standard), [positionNode](#basic), etc. This preserves the integrity of the lighting model while allowing customizations, helping to avoid mistakes from incorrect setups.
- Keeping an eye on software exchange
  - Modern 3D authoring software uses Shader-Graph based material composition to exchange between other software. TSL already has its own MaterialX integration.
- Easier Migration
  - Many functions are directly inspired by GLSL to smooth the learning curve for those with prior experience.

### Rendering Manipulation

- Control rendering steps and create new render-passes per individual TSL functions.
  - Implement complex effects is easily with nodes using a single function call either in post-processing and in materials allowing the node itself to manage the rendering process as it needs.
    - `gaussianBlur()`: Double render-pass gaussian blur node. It can be used in the material or in post-processing through a single function.
  - Easy access to renderer buffers using TSL functions like: 
    - `viewportSharedTexture()`: Accesses the beauty what has already been rendered, preserving the render-order.
    - `viewportLinearDepth()`: Accesses the depth what has already been rendered, preserving the render-order.
  - Integrated Compute Shaders
    - Perform calculations on buffers using compute stage directly during an object's rendering.
  - TSL allows dynamic manipulation of renderer functions, which makes it more customizable than intermediate languages ​​that would have to use flags in fixed pipelines for this.
  - You just need to use the events of a Node for the renderer manipulations, without needing to modify the core.

### Automatic Optimization and Workarounds

- Your TSL code automatically benefits from optimizations and workarounds implemented in the Three.js compiler with each new version.
  - Simplifications
    - Automatic type conversions.
    - Execute a block of code in vertex-stage and get it in fragment-stage just using `vertexStage( node )`.
    - Automatically choose interpolation method for varyings depending on type.
    - Don't worry about collisions of global variables internally when using Nodes.
  - Polyfills
    - e.g: `textureSample()` function in the vertex shader (not natively supported in WGSL) is correctly transpiled to work.
    - e.g: Automatic correction for the `pow()` function, which didn't accept negative bases on Windows/DirectX using WGSL.
  - Optimizations
    - Repeated expressions: TSL can automatically create temporary variables to avoid redundant calculations.
    - Automatic reuse of uniforms and attributes.
    - Creating varying only if necessary. Otherwise they are replaced by simple variables.

### Target audience
  - Beginners users
    - You only need one line to create your first custom shader.
  - Advanced users
    - Makes creating shaders simple but not limited. Example: https://www.youtube.com/watch?v=C2gDL9Qk_vo
    - If you don't like fixed pipelines and low level, you'll love this.

### Share everything

#### TSL is based on Nodes, so don’t worry about sharing your **functions** and **uniforms** across materials and post-processing.

```js
// Shared the same uniform with various materials

const sharedColor = uniform( new THREE.Color() );

materialA.colorNode = sharedColor.div( 2 );
materialB.colorNode = sharedColor.mul( .5 );
materialC.colorNode = sharedColor.add( .5 );
```

#### Deferred Function: High level of customization, goodby **#defines**

Access **material**, **geometry**, **object**, **camera**, **scene**, **renderer** and more directly from a TSL function. Function calls are only performed at the time of building the shader allowing you to customize the function according to the object's setup.

```js
// Returns an uniform of the material's custom color if it exists 

const customColor = Fn( ( { material, geometry, object } ) => {

	if ( material.userData.customColor !== undefined ) {

		return uniform( material.userData.customColor );

	}

	return vec3( 0 );

} );

//

material.colorNode = customColor();

```

#### Load a texture-based matrix inside a TSL function

This can be used for any other JS and Three.js ecosystem needs. You can manipulate your assets according to the needs of a function. This can work for creating buffers, attributes, uniforms and any other JavaScript operation.

```js
let bayer16Texture = null;

export const bayer16 = Fn( ( [ uv ] ) => {

	if ( bayer16Texture === null ) {

		const bayer16Base64 = 'data:image/png;base64,...==';

		bayer16Texture = new TextureLoader().load( bayer16Base64 );

	}

	return textureLoad( bayer16Texture, ivec2( uv ).mod( int( 16 ) ) );

} );

//

material.colorNode = bayer16( screenCoordinate );

```

#### The node architecture allows the creation of instances of custom attributes and buffers through simple functions.

```js
// Range values node example

const randomColor = range( new THREE.Color( 0x000000 ), new THREE.Color( 0xFFFFFF ) );

material.colorNode = randomColor;

//...

const mesh = new THREE.InstancedMesh( geometry, material, count );
```

#### TSL loves JavaScript

TSL syntax follows JavaScript style because they are the same thing, so if you come from GLSL you can explore new possibilities.

```js
// A simple example of Function closure

const mainTask = Fn( () => {

	const task2 = Fn( ( [ a, b ] ) => {

		return a.add( b ).mul( 0.5 );

	} );


	return task2( color( 0x00ff00 ), color( 0x0000ff ) );

} );

//

material.colorNode = mainTask();
```

#### Simplification

Double render-pass `gaussianBlur()` node. It can be used in the material or in post-processing through a single function. 

```js
// Applies a double render-pass gaussianBlur and then a grayscale filter before the object with the material is rendered.

const myTexture = texture( map );

material.colorNode = grayscale( gaussianBlur( myTexture, 4 ) );
```

Accesses what has already been rendered, preserving the render-order for easy refraction effects, avoiding multiple render-pass and manual sorts.

```js
// Leaving the back in grayscale.

material.colorNode = grayscale( viewportSharedTexture( screenUV ) );
material.transparent = true;
```

#### Extend the TSL

You no longer need to create a Material for each desired effect, instead create Nodes. A Node can have access to the Material and can be used in many ways. Extend the TSL from Nodes and let the user use it in creative ways.

A great example of this is [TSL-Textures](https://boytchev.github.io/tsl-textures/).

```js
import * as THREE from 'three';
import { simplexNoise } from 'tsl-textures';

material.colorNode = simplexNoise ( {
	scale: 2,
	balance: 0,
	contrast: 0,
	color: new THREE.Color(16777215),
	background: new THREE.Color(0),
	seed: 0
} );

```
