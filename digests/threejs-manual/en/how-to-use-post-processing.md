<!-- ingested from https://threejs.org/manual/en/how-to-use-post-processing.html (direct markdown, no model) -->

How to use Post Processing 

 Many three.js applications render their 3D objects directly to the screen. Sometimes, however, you want to apply one or more graphical
 effects like Depth-Of-Field, Bloom, Film Grain or various types of Anti-aliasing. Post-processing is a widely used approach
 to implement such effects. First, the scene is rendered to a render target which represents a buffer in the video card's memory.
 In the next step one or more post-processing passes apply filters and effects to the image buffer before it is eventually rendered to
 the screen.

 three.js provides a complete post-processing solution via `EffectComposer` to implement such a workflow.

 Workflow 

 The first step in the process is to import all necessary files from the examples directory. The guide assumes you are using the official
 [link:https://www.npmjs.com/package/three npm package] of three.js. For our basic demo in this guide we need the following files.



```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GlitchPass } from 'three/addons/postprocessing/GlitchPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
```



 After all files are successfully imported, we can create our composer by passing in an instance of `WebGLRenderer`.



```js
const composer = new EffectComposer( renderer );
```



 When using a composer, it's necessary to change the application's animation loop. Instead of calling the render method of
 `WebGLRenderer`, we now use the respective counterpart of `EffectComposer`.



```js
function animate() {

  requestAnimationFrame( animate );

  composer.render();

}
```



 Our composer is now ready so it's possible to configure the chain of post-processing passes. These passes are responsible for creating
 the final visual output of the application. They are processed in order of their addition/insertion. In our example, the instance of `RenderPass`
 is executed first, then the instance of `GlitchPass` and finally `OutputPass`. The last enabled pass in the chain is automatically rendered to the screen. 
 The setup of the passes looks like so:



```js
const renderPass = new RenderPass( scene, camera );
composer.addPass( renderPass );

const glitchPass = new GlitchPass();
composer.addPass( glitchPass );

const outputPass = new OutputPass();
composer.addPass( outputPass );
```



 `RenderPass` is normally placed at the beginning of the chain in order to provide the rendered scene as an input for the next post-processing step. In our case,
 `GlitchPass` is going to use these image data to apply a wild glitch effect. `OutputPass` is usually the last pass in the chain which performs sRGB color space conversion and tone mapping.
 Check out this [link:https://threejs.org/examples/webgl_postprocessing_glitch live example] to see it in action.

 Built-in Passes 

 You can use a wide range of pre-defined post-processing passes provided by the engine. They are located in the
 [link:https://github.com/mrdoob/three.js/tree/dev/examples/jsm/postprocessing postprocessing] directory.

 Custom Passes 

 Sometimes you want to write a custom post-processing shader and include it into the chain of post-processing passes. For this scenario,
 you can utilize `ShaderPass`. After importing the file and your custom shader, you can use the following code to setup the pass.



```js
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { LuminosityShader } from 'three/addons/shaders/LuminosityShader.js';

// later in your init routine

const luminosityPass = new ShaderPass( LuminosityShader );
composer.addPass( luminosityPass );
```



 The repository provides a file called [link:https://github.com/mrdoob/three.js/blob/master/examples/jsm/shaders/CopyShader.js CopyShader] which is a
 good starting code for your own custom shader. `CopyShader` just copies the image contents of the `EffectComposer`'s read buffer
 to its write buffer without applying any effects.
