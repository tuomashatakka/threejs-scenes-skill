<!-- ingested from https://threejs.org/manual/en/webgpu-postprocessing.html (direct markdown, no model) -->

Post-Processing with WebGPURenderer 

 `WebGPURenderer` comes with a brand-new component for post-processing. This article shows how the new system 
 works and provides some basic guidelines about the usage.

 Overview 

 The previous post-processing for `WebGLRenderer` had many conceptual issues. Making use of Multiple Render Targets 
 (MRT) was cumbersome due to the limited support in the renderer and there was no automatic pass/effect combination
 to improve the overall performance.

 The new post-processing stack for `WebGPURenderer` was designed to support these use cases right from the beginning.

 `WebGPURenderer` comes with full, built-in MRT support.

 The system combines effects if possible which reduces the overall number of render passes.

 The effect chain is expressed as a node composition which allows a more flexible effect setup.

 Let's find out how to integrate post-processing in three.js applications.

 Basics 

 First, please read the instructions in the guide about WebGPURenderer to correctly configure your 
 imports. After that, you can create an instance of the render pipleine module like so:



```js
const renderPipeline = new THREE.RenderPipeline( renderer );
```



 The instance of `RenderPipeline` replaces the previous instance of `EffectComposer`. To make sure you actually
 use the output of the module, you have to update your animation loop like so:
 


```js
-  renderer.render( scene, camera );
+  renderPipeline.render();
```



 Many post-processing setups start with a so called "scene pass" or "beauty pass" that represents the image of you rendered scene.
 This image should be subsequently enhanced by different effects like Bloom, Depth-of-Field or SSR. Start by importing the `pass()` TSL 
 function from the TSL namespace and use it to create the pass.
 


```js
import { pass } from 'three/tsl';

// in your init routine

const scenePass = pass( scene, camera );
```


 
 The basic idea of the node system is to represent materials or post-processing effects as node compositions. To configure a basic 
 Dotscreen and RGB shift effect, you create effect nodes with TSL functions and compose them together.



```js
import { pass } from 'three/tsl';
+  import { dotScreen } from 'three/addons/tsl/display/DotScreenNode.js';
+  import { rgbShift } from 'three/addons/tsl/display/RGBShiftNode.js';

// in your init routine

const scenePass = pass( scene, camera );

+  const dotScreenPass = dotScreen( scenePass );
+  const rgbShiftPass = rgbShift( dotScreenPass );
```



 When you are done, you can simply assign the final node to the `RenderPipeline` instance.
 


```js
renderPipeline.outputNode = rgbShiftPass;
```



 Tone Mapping and Color Spaces 

 When using post-processing, tone mapping and color space conversion are automatically applied at the end 
 of your effect chain. Sometimes you want full control over how and when these steps are executed though.
 For example if you want to apply FXAA with `FXAANode` or color grading with `Lut3DNode`, you can disable automatic tone 
 mapping and color space conversion and apply it via `renderOutput()` by yourself.



```js
import { pass, renderOutput } from 'three/tsl';
import { fxaa } from 'three/addons/tsl/display/FXAANode.js';

// in your init routine

const renderPipeline = new THREE.RenderPipeline( renderer );
renderPipeline.outputColorTransform = false; // disable default output color transform

const scenePass = pass( scene, camera );
const outputPass = renderOutput( scenePass ); // apply tone mapping and color space conversion here

// FXAA must be computed in sRGB color space

const fxaaPass = fxaa( outputPass );
renderPipeline.outputNode = fxaaPass;
```



 It is not mandatory to use `renderOutput()`, you can also implement a custom tone mapping and color space conversion
 based on your requirements.

 MRT 

 The new post-processing stack has built-in Multiple Render Targets (MRT) support which is crucial for more advanced
 setups. MRT allows you to produce multiple outputs in a single render pass. So for example when rendering your scene 
 with TRAA, you need below setup to prepare the inputs for the anti-aliasing.



```js
import { pass, mrt, output, velocity } from 'three/tsl';

// in your init routine

const scenePass = pass( scene, camera );
scenePass.setMRT( mrt( {
  output: output,
  velocity: velocity
} ) );
```


 
 The configuration object you assign to the `mrt()` TSL function describes the different outputs of the pass. In this case,
 we save the default output (the scene's beauty) and scene's velocity since we want to setup a TRAA. If you also require 
 the scene's depth, there is no need to configure it as a MRT output. You get it for free in your default output pass if 
 you request it in your app. If you know want to use these outputs in subsequent effects, you can query them as texture nodes.



```js
import { traa } from 'three/addons/tsl/display/TRAANode.js';

// in your init routine

const scenePassColor = scenePass.getTextureNode( 'output' );
const scenePassDepth = scenePass.getTextureNode( 'depth' );
const scenePassVelocity = scenePass.getTextureNode( 'velocity' );

const traaPass = traa( scenePassColor, scenePassDepth, scenePassVelocity, camera );
renderPipeline.outputNode = traaPass;
```



 The MRT configuration varies depending on your setup. There are many different TSL objects like `output`, `velocity`,
 `normalView` or `emissive` than you can use to save per-fragment data in MRT attachments. To improve performance and avoid
 hitting memory restrictions, it's important to pack and optimize your data in complex MRT setups. By default all attachments 
 are RGBA16 (Half-Float) in precision which is not necessary for all types of data. As an example, below code queries the 
 `diffuseColor` attachment and sets its format to RGBA8 which cuts down the memory and bandwidth by half.



```js
const diffuseTexture = scenePass.getTexture( 'diffuseColor' );
diffuseTexture.type = THREE.UnsignedByteType;
```



 Below setup for Scree-Space Reflections (SSR) converts the default FP16 normals into RGBA8 colors and packs metalness/roughness 
 into a single attachment. The usage of the `sample()` TSL functions allows to implement custom unpacking. In this instance, it
 converts the color back to a (normalized) direction vector.



```js
scenePass.setMRT( mrt( {
  output: output,
  normal: directionToColor( normalView ),
  metalrough: vec2( metalness, roughness )
} ) );

// use RGBA8 instead of RGBA16

const normalTexture = scenePass.getTexture( 'normal' );
normalTexture.type = THREE.UnsignedByteType;

const metalRoughTexture = scenePass.getTexture( 'metalrough' );
metalRoughTexture.type = THREE.UnsignedByteType;

// custom unpacking. use the resulting "sceneNormal" instead of "scenePassNormal"
// in subsequent effects

const sceneNormal = sample( ( uv ) => {

  return colorToDirection( scenePassNormal.sample( uv ) );

} );
```



 We want to further improve the packing/unpacking features in the future to offer more ways to pack/unpack MRT data. In the meanwhile,
 please have a look at the official examples to
 get an overview about the existing effects and setups.
