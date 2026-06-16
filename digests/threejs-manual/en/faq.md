<!-- ingested from https://threejs.org/manual/en/faq.html (direct markdown, no model) -->

FAQ 

 Which 3D model format is best supported? 

 The recommended format for importing and exporting assets is glTF (GL Transmission Format). Because glTF is focused on runtime asset delivery, it is compact to transmit and fast to load.

 three.js provides loaders for many other popular formats like FBX, Collada or OBJ as well. Nevertheless, you should always try to establish a glTF based workflow in your projects first. 

 Why are there meta viewport tags in examples? 
 


```js
<meta name="viewport" content="width=device-width, user-scalable=no, minimum-scale=1.0, maximum-scale=1.0">
```


 
 These tags control viewport size and scale for mobile browsers (where page content may be rendered at different size than visible viewport). 
 
 [link:https://developer.apple.com/library/content/documentation/AppleApplications/Reference/SafariWebContent/UsingtheViewport/UsingtheViewport.html Safari: Using the Viewport] 
 
 [link:https://developer.mozilla.org/en-US/docs/Web/HTML/Viewport_meta_tag MDN: Using the viewport meta tag] 

 How can scene scale be preserved on resize? 
 
 We want all objects, regardless of their distance from the camera, to appear the same size, even as the window is resized.
 
 The key equation to solving this is this formula for the visible height at a given distance:
 


```js
visible_height = 2 * Math.tan( ( Math.PI / 180 ) * camera.fov / 2 ) * distance_from_camera;
```


 If we increase the window height by a certain percentage, then what we want is the visible height at all distances
 to increase by the same percentage.
 
 This can not be done by changing the camera position. Instead you have to change the camera field-of-view.
 [link:http://jsfiddle.net/Q4Jpu/ Example].

 Why is part of my object invisible? 
 
 This could be because of face culling. Faces have an orientation that decides which side is which. And the culling removes the backside in normal circumstances. 
 To see if this is your problem, change the material side to THREE.DoubleSide.


```js
material.side = THREE.DoubleSide
```



 Why does three.js sometimes return strange results for invalid inputs? 
 
 For performance reasons, three.js doesn't validate inputs in most cases. It's your app's responsibility to make sure that all inputs are valid.

 Can I use three.js in Node.js? 
 
 Because three.js is built for the web, it depends on browser and DOM APIs that don't always exist in Node.js. Some of these issues can be avoided by using shims like 
 [link:https://github.com/stackgl/headless-gl headless-gl] and [link:https://github.com/rstacruz/jsdom-global jsdom-global], or by replacing components like `TextureLoader` 
 with custom alternatives. Other DOM APIs may be deeply intertwined with the code that uses them, and will be harder to work around. We welcome simple and maintainable pull 
 requests to improve Node.js support, but recommend opening an issue to discuss your improvements first.
