<!-- ingested from https://threejs.org/manual/en/how-to-create-vr-content.html (direct markdown, no model) -->

How to create VR content 

 This guide provides a brief overview of the basic components of a web-based VR application
 made with three.js.

 Workflow 

 First, you have to include [link:https://github.com/mrdoob/three.js/blob/master/examples/jsm/webxr/VRButton.js VRButton.js]
 into your project.



```js
import { VRButton } from 'three/addons/webxr/VRButton.js';
```



 *VRButton.createButton()* does two important things: It creates a button which indicates
 VR compatibility. Besides, it initiates a VR session if the user activates the button. The only thing you have
 to do is to add the following line of code to your app.



```js
document.body.appendChild( VRButton.createButton( renderer ) );
```



 Next, you have to tell your instance of `WebGLRenderer` to enable XR rendering.



```js
renderer.xr.enabled = true;
```



 Finally, you have to adjust your animation loop since we can't use our well known
 *window.requestAnimationFrame()* function. For VR projects we use `renderer.setAnimationLoop()`.
 The minimal code looks like this:



```js
renderer.setAnimationLoop( function () {

  renderer.render( scene, camera );

} );
```


 
 Next Steps 

 Have a look at one of the official WebVR examples to see this workflow in action. 
 
 [example:webxr_xr_ballshooter WebXR / XR / ballshooter] 
 [example:webxr_xr_cubes WebXR / XR / cubes] 
 [example:webxr_xr_dragging WebXR / XR / dragging] 
 [example:webxr_xr_marchingcubes WebXR / XR / marching cubes] 
 [example:webxr_xr_paint WebXR / XR / paint] 
 [example:webxr_vr_panorama_depth WebXR / VR / panorama_depth] 
 [example:webxr_vr_panorama WebXR / VR / panorama] 
 [example:webxr_vr_rollercoaster WebXR / VR / rollercoaster] 
 [example:webxr_vr_sandbox WebXR / VR / sandbox] 
 [example:webxr_vr_video WebXR / VR / video]
