<!-- ingested from https://threejs.org/manual/en/webgpurenderer.html (direct markdown, no model) -->

WebGPURenderer 

 The new `WebGPURenderer` is the next-generation renderer for three.js. This article provides a short overview about the new 
 renderer and basic guidelines about the usage.

 Overview 

 `WebGPURenderer` is designed to be the modern alternative to the long-standing `WebGLRenderer`.
 Its primary goal is to use WebGPU, which is a modern, high-performance graphics and compute 3D API. However, it's built to be a 
 universal renderer. If a device/browser doesn't support WebGPU, the renderer can automatically fall back to using a WebGL 2 backend.

 Providing a WebGL 2 backend as a fallback is a crucial design decision since it allows applications to benefit from WebGPU but without 
 sacrificing the support for devices which only support WebGL 2.

 Apart from the fact that `WebGPURenderer` enables access to WebGPU, it offers an exciting feature set:

 `WebGPURenderer` comes with a new node-based material system which allows to develop custom materials with greater flexibility and 
 more robustness.

 The renderer supports TSL, the three.js shading language. With TSL, developers can write shader code with JavaScript in a 
 platform-independent manner. Shader code written in TSL can be transpiled to WGSL or GLSL depending on the available backend.

 `WebGPURenderer` comes with a new post-processing stack with built-in Multiple Render Targets (MRT) support and automatic pass combination thanks to the 
 node material.

 Let's find out how to integrate `WebGPURenderer` in three.js applications.

 Usage 

 `WebGPURenderer` has different build files so the way you import three.js changes:



```js
-  import * as THREE from 'three';
+  import * as THREE from 'three/webgpu';
```



 If you are using an import map, it's recommended to change it to the following (the paths differ depending on your setup):
 


```js
<script type="importmap">
    {
      "imports": {
        "three": "../build/three.webgpu.js",
        "three/webgpu": "../build/three.webgpu.js",
        "three/tsl": "../build/three.tsl.js",
        "three/addons/": "./jsm/"
      }
    }
  </script>
```



 You can create an instance of the renderer just like with `WebGLRenderer`:



```js
const renderer = new THREE.WebGPURenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( render );
document.body.appendChild( renderer.domElement );
```


 
 It's important to understand that WebGPU is initialized in an asynchronous fashion. Hence, it is recommended to use 
 `setAnimationLoop()` to define the animation loop of your app since this approach will automatically ensure the renderer
 is initialized when rendering the first frame. If you prefer to manage your animation loop via `window.requestAnimationFrame()` or
 if you have to use the renderer in your init routine, you need an additional line in the above code section.
 


```js
const renderer = new THREE.WebGPURenderer( { antialias: true } );
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( render );
document.body.appendChild( renderer.domElement );

+  await renderer.init();
```


 
 Most common methods known from `WebGLRenderer` like `clear()`, `setRenderTarget()`or `dispose()` are also present in `WebGPURenderer`. 
 Please have a look at the API documentation for a full overview of the renderer's public interface.

 Like mentioned in the initial part of the guide, `WebGPURenderer` uses a WebGPU backend by default and a WebGL 2 backend as a fallback. 
 If you want to force the usage of WebGL 2 for testing purposes or if you want to exclude the usage of WebGPU for certain reasons, you can 
 make use of the `forceWebGL` parameter.
 


```js
-  const renderer = new THREE.WebGPURenderer( { antialias: true } );
+  const renderer = new THREE.WebGPURenderer( { antialias: true, forceWebGL: true } );
```



 Migration 

 If you want to give `WebGPURenderer` a try, you have to be aware of the following.

 Custom materials based on `ShaderMaterial`, `RawShaderMaterial` and modifications of built-in materials via `onBeforeCompile()`
 are not supported in `WebGPURenderer`. This part of your application must be ported to node materials and TSL.

 `EffectComposer` with its effect passes are not supported because `WebGPURenderer` comes with a new, more modern 
 post-processing stack. Similar to materials, post-processing effects are now written in TSL and the effect chain is expressed 
 as a node composition. All common effects have already been ported to `WebGPURenderer` and exist in a more performant version
 as a node class. We have also added new effects like SSGI, SSS or a better DoF exclusively for the new renderer. Check out the
 official examples to get an overview of
 the current supported effects.

 The renderer itself is still in an experimental state although its maturity level has been greatly improved in the last years. 
 Still, depending on your application and scene setup, you will encounter missing features or a better performance with `WebGLRenderer`. 
 Feel free to file an issue at GitHub so we are aware of open tasks. We are improving `WebGPURenderer` with each release so it's 
 recommended to upgrade to the latest version whenever possible.

 State of WebGLRenderer 

 Although in the meanwhile a lot of work happens in context of `WebGPURenderer`, the node material and TSL, `WebGLRenderer` is still maintained 
 and the recommended choice for pure WebGL 2 applications. However, keep in mind that there are no plans to add larger new features to 
 the renderer since the project's focus is now on `WebGPURenderer` which you can easily see at the latest release notes. That said,
 we are currently investigating the possibility to add limited node material support to `WebGLRenderer` in order to make the transition to
 `WebGPURenderer` easier for certain projects.
