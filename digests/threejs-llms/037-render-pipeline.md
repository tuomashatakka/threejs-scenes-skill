## Render Pipeline

The `RenderPipeline` provides full control over the rendering process. It enables developers to build complex multi-pass rendering pipelines entirely in JavaScript, combining scene rendering, post-processing, and compute operations in a unified, composable workflow.

#### Basic Usage

```js
import * as THREE from 'three/webgpu';
import { pass } from 'three/tsl';

// Create the render pipeline
const renderPipeline = new THREE.RenderPipeline( renderer );

// Create a scene pass
const scenePass = pass( scene, camera );

// Set the output
renderPipeline.outputNode = scenePass;

// In the animation loop
function animate() {

	renderPipeline.render();

}
```

### Multiple Render Targets (MRT)

MRT allows capturing multiple outputs from a single render pass. Instead of rendering the scene multiple times to get different data (color, normals, depth, velocity), MRT captures all of them in one draw call—significantly improving performance.

#### Setting up MRT

Use `setMRT()` with the `mrt()` function to define which outputs to capture:

```js
import { pass, mrt, output, normalView, velocity, directionToColor } from 'three/tsl';

const scenePass = pass( scene, camera );

scenePass.setMRT( mrt( {
	output: output,                          // Final color output
	normal: directionToColor( normalView ),  // View-space normals encoded as colors
	velocity: velocity                       // Motion vectors for temporal effects
} ) );
```

Each MRT entry accepts any TSL node, allowing you to customize outputs using formulas, encoders, or material accessors. For example, `directionToColor( normalView )` encodes view-space normals into RGB values. You can use any TSL function to transform, combine, or encode data before writing to the render target.

Within a TSL function `Fn( ( { material, object } ) => { ... } )`, you have complete access to the current material and object being rendered, enabling full customization of outputs.

#### Accessing MRT Buffers

Each MRT output becomes available as a texture node via `getTextureNode()`:

```js
// Access individual buffers as texture nodes
const colorTexture = scenePass.getTextureNode( 'output' );
const normalTexture = scenePass.getTextureNode( 'normal' );
const velocityTexture = scenePass.getTextureNode( 'velocity' );

// Depth is always available, even without MRT
const depthTexture = scenePass.getTextureNode( 'depth' );
```

These texture nodes can be sampled, transformed, and passed to post-processing effects or other passes.

#### Optimizing MRT Textures

You can access the textures to optimize memory usage and bandwidth. Using smaller data types reduces GPU memory transfers, which is critical for performance on bandwidth-limited devices:

```js
// Use 8-bit format for encoded normals, default is 16-bit
const normalTexture = scenePass.getTexture( 'normal' );
normalTexture.type = THREE.UnsignedByteType;
```

#### Dynamic Pipeline Updates

The pipeline can be updated at runtime:

```js
if ( showNormals ) {

	renderPipeline.outputNode = prePass;

} else {

	renderPipeline.outputNode = traaPass;

}

renderPipeline.needsUpdate = true;
```

### Post-Processing

TSL utilities for post-processing effects. They can be used in materials or post-processing passes.

| Name | Description |
| -- | -- |
| `afterImage( node, damp = 0.96 )` | Creates an after image effect. |
| `anamorphic( node, threshold = 0.9, scale = 3, samples = 32 )` | Creates an anamorphic flare effect. |
| `bloom( node, strength = 1, radius = 0, threshold = 0 )` | Creates a bloom effect. |
| `boxBlur( textureNode, options = {} )` | Applies a box blur effect. |
| `chromaticAberration( node, strength = 1.0, center = null, scale = 1.1 )` | Creates a chromatic aberration effect. |
| `denoise( node, depthNode, normalNode, camera )` | Creates a denoise effect. |
| `dof( node, viewZNode, focusDistance, focalLength, bokehScale )` | Creates a depth-of-field effect. |
| `dotScreen( node, angle = 1.57, scale = 1 )` | Creates a dot-screen effect. |
| `film( inputNode, intensityNode = null, uvNode = null )` | Creates a film grain effect. |
| `fxaa( node )` | Creates a FXAA anti-aliasing effect. |
| `gaussianBlur( node, directionNode, sigma, options = {} )` | Creates a gaussian blur effect. |
| `grayscale( color )` | Converts color to grayscale. |
| `hashBlur( textureNode, bluramount = float( 0.1 ), options = {} )` | Applies a hash blur effect. |
| `lut3D( node, lut, size, intensity )` | Creates a LUT color grading effect. |
| `motionBlur( inputNode, velocity, numSamples = int( 16 ) )` | Creates a motion blur effect. |
| `outline( scene, camera, params )` | Creates an outline effect around selected objects. |
| `rgbShift( node, amount = 0.005, angle = 0 )` | Creates an RGB shift effect. |
| `sepia( color )` | Applies a sepia effect. |
| `smaa( node )` | Creates a SMAA anti-aliasing effect. |
| `sobel( node )` | Creates a sobel edge detection effect. |
| `ssr( colorNode, depthNode, normalNode, metalnessNode, roughnessNode = null, camera = null )` | Creates screen space reflections. |
| `ssgi( beautyNode, depthNode, normalNode, camera )` | Creates a SSGI effect. |
| `ao( depthNode, normalNode, camera )` | Creates a Ground Truth Ambient Occlusion (GTAO) effect. |
| `transition( nodeA, nodeB, mixTextureNode, mixRatio, threshold, useTexture )` | Creates a transition effect between two scenes. |
| `traa( beautyNode, depthNode, velocityNode, camera )` | Creates a TRAA temporal anti-aliasing effect. |
| `renderOutput( node, targetColorSpace, targetToneMapping )` | Apply the renderer output settings in the node. |

Example:

```js
import { grayscale, pass } from 'three/tsl';
import { gaussianBlur } from 'three/addons/tsl/display/GaussianBlurNode.js';

// Post-processing
const scenePass = pass( scene, camera );
const output = scenePass.getTextureNode(); // default parameter is 'output'

renderPipeline.outputNode = grayscale( gaussianBlur( output, 4 ) );
```

### Render Pass

Functions for creating and managing render passes.

| Name | Description |
| -- | -- |
| `pass( scene, camera, options = {} )` | Creates a pass node for rendering a scene. |
| `mrt( outputNodes )` | Creates a Multiple Render Targets (MRT) node. |

Example:

```js
import { pass, mrt, output, emissive } from 'three/tsl';

const scenePass = pass( scene, camera );

// Setup MRT
scenePass.setMRT( mrt( {
	output: output,
	emissive: emissive
} ) );

const outputNode = scenePass.getTextureNode( 'output' );
const emissiveNode = scenePass.getTextureNode( 'emissive' );
```

### Compute

Compute shaders allow general-purpose GPU computations. TSL provides functions for creating and managing compute operations.

| Name | Description |
| -- | -- |
| `compute( node, count = null, workgroupSize = [ 64 ] )` | Creates a compute node. |
| `atomicAdd( node, value )` | Performs an atomic addition. |
| `atomicSub( node, value )` | Performs an atomic subtraction. |
| `atomicMax( node, value )` | Performs an atomic max operation. |
| `atomicMin( node, value )` | Performs an atomic min operation. |
| `atomicAnd( node, value )` | Performs an atomic AND operation. |
| `atomicOr( node, value )` | Performs an atomic OR operation. |
| `atomicXor( node, value )` | Performs an atomic XOR operation. |
| `atomicStore( node, value )` | Stores a value atomically. |
| `atomicLoad( node )` | Loads a value atomically. |
| `workgroupBarrier()` | Creates a workgroup barrier. |
| `storageBarrier()` | Creates a storage barrier. |
| `textureBarrier()` | Creates a texture barrier. |
| `barrier()` | Creates a memory barrier. |
| `workgroupId` | The workgroup ID. |
| `localId` | The local invocation ID within the workgroup. |
| `globalId` | The global invocation ID. |
| `numWorkgroups` | The number of workgroups. |
| `subgroupSize` | The size of the subgroup. |

Example:

```js
import { Fn, instancedArray, instanceIndex, deltaTime } from 'three/tsl';

const count = 1000;
const positionArray = instancedArray( count, 'vec3' );

// create a compute function

const computeShader = Fn( () => {

	const position = positionArray.element( instanceIndex );

	position.x.addAssign( deltaTime );

} )().compute( count );

//

renderer.compute( computeShader );
```
