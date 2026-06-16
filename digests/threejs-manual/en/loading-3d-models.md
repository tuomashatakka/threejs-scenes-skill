<!-- ingested from https://threejs.org/manual/en/loading-3d-models.html (direct markdown, no model) -->

Loading 3D Models 

 3D models are available in hundreds of file formats, each with different
 purposes, assorted features, and varying complexity. Although
 
 three.js provides many loaders , choosing the right format and
 workflow will save time and frustration later on. Some formats are
 difficult to work with, inefficient for realtime experiences, or simply not
 fully supported at this time.

 This guide provides a workflow recommended for most users, and suggestions
 for what to try if things don't go as expected.

 Before we start 

 If you're new to running a local server, begin with
 Installation 
 first. Many common errors viewing 3D models can be avoided by hosting files
 correctly.

 Recommended workflow 

 Where possible, we recommend using glTF (GL Transmission Format). Both
 .GLB and .GLTF versions of the format are
 well supported. Because glTF is focused on runtime asset delivery, it is
 compact to transmit and fast to load. Features include meshes, materials,
 textures, skins, skeletons, morph targets, animations, lights, and
 cameras.

 Public-domain glTF files are available on sites like
 
 Sketchfab , or various tools include glTF export:

 Blender by the Blender Foundation 
 Substance Painter by Allegorithmic 
 Modo by Foundry 
 Toolbag by Marmoset 
 Houdini by SideFX 
 Cinema 4D by MAXON 
 COLLADA2GLTF by the Khronos Group 
 FBX2GLTF by Facebook 
 OBJ2GLTF by Analytical Graphics Inc 
 &hellip;and many more 

 If your preferred tools do not support glTF, consider requesting glTF
 export from the authors, or posting on
 the glTF roadmap thread .

 When glTF is not an option, popular formats such as FBX, OBJ, or COLLADA
 are also available and regularly maintained.

 Loading 

 Only a few loaders (e.g. `ObjectLoader`) are included by default with
 three.js — others should be added to your app individually.



```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```



 Once you've imported a loader, you're ready to add a model to your scene. Syntax varies among
 different loaders — when using another format, check the examples and documentation for that
 loader. For glTF, usage with global scripts would be:



```js
const loader = new GLTFLoader();

loader.load( 'path/to/model.glb', function ( gltf ) {

  scene.add( gltf.scene );

}, undefined, function ( error ) {

  console.error( error );

} );
```


 
 Troubleshooting 

 You've spent hours modeling an artisanal masterpiece, you load it into
 the webpage, and — oh no! 😭 It's distorted, miscolored, or missing entirely.
 Start with these troubleshooting steps:

 Check the JavaScript console for errors, and make sure you've used an
 `onError` callback when calling `.load()` to log the result.

 View the model in another application. For glTF, drag-and-drop viewers
 are available for
 three.js and
 babylon.js . If the model
 appears correctly in one or more applications,
 file a bug against three.js .
 If the model cannot be shown in any application, we strongly encourage
 filing a bug with the application used to create the model.

 Try scaling the model up or down by a factor of 1000. Many models are
 scaled differently, and large models may not appear if the camera is
 inside the model.

 Try to add and position a light source. The model may be hidden in the dark.

 Look for failed texture requests in the network tab, like
 `"C:\\Path\To\Model\texture.jpg"`. Use paths relative to your
 model instead, such as `images/texture.jpg` — this may require
 editing the model file in a text editor.

 Asking for help 

 If you've gone through the troubleshooting process above and your model
 still isn't working, the right approach to asking for help will get you to
 a solution faster. Post a question on the
 three.js forum and, whenever possible,
 include your model (or a simpler model with the same problem) in any formats
 you have available. Include enough information for someone else to reproduce
 the issue quickly — ideally, a live demo.
