<!-- ingested from https://threejs.org/manual/en/how-to-update-things.html (direct markdown, no model) -->

How to update Things 

 All objects by default automatically update their matrices if they have been added to the scene with 


```js
const object = new THREE.Object3D();
scene.add( object );
```


 or if they are the child of another object that has been added to the scene:


```js
const object1 = new THREE.Object3D();
const object2 = new THREE.Object3D();

object1.add( object2 );
scene.add( object1 ); //object1 and object2 will automatically update their matrices
```



 However, if you know the object will be static, you can disable this and update the transform matrix manually just when needed. 
 


```js
object.matrixAutoUpdate = false;
object.updateMatrix();
```


 
 BufferGeometry 

 BufferGeometries store information (such as vertex positions, face indices, normals, colors,
 UVs, and any custom attributes) in attribute buffers - that is,
 [link:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Typed_arrays typed arrays].
 This makes them generally faster than standard Geometries, at the cost of being somewhat harder to
 work with.

 With regards to updating BufferGeometries, the most important thing to understand is that
 you cannot resize buffers (this is very costly, basically the equivalent to creating a new geometry).
 You can however update the content of buffers.

 This means that if you know an attribute of your BufferGeometry will grow, say the number of vertices,
 you must pre-allocate a buffer large enough to hold any new vertices that may be created. Of
 course, this also means that there will be a maximum size for your BufferGeometry - there is
 no way to create a BufferGeometry that can efficiently be extended indefinitely.

 We'll use the example of a line that gets extended at render time. We'll allocate space
 in the buffer for 500 vertices but draw only two at first, using `BufferGeometry.drawRange`.
 


```js
const MAX_POINTS = 500;

// geometry
const geometry = new THREE.BufferGeometry();

// attributes
const positions = new Float32Array( MAX_POINTS * 3 ); // 3 floats (x, y and z) per point
geometry.setAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );

// draw range
const drawCount = 2; // draw the first 2 points, only
geometry.setDrawRange( 0, drawCount );

// material
const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );

// line
const line = new THREE.Line( geometry, material );
scene.add( line );
```


 
 Next we'll randomly add points to the line using a pattern like:
 


```js
const positionAttribute = line.geometry.getAttribute( 'position' );

let x = 0, y = 0, z = 0;

for ( let i = 0; i < positionAttribute.count; i ++ ) {

    positionAttribute.setXYZ( i, x, y, z );

    x += ( Math.random() - 0.5 ) * 30;
    y += ( Math.random() - 0.5 ) * 30;
    z += ( Math.random() - 0.5 ) * 30;

}
```


 
 If you want to change the number of points rendered after the first render, do this:
 


```js
line.geometry.setDrawRange( 0, newValue );
```


 
 If you want to change the position data values after the first render, you need to
 set the needsUpdate flag like so:
 


```js
positionAttribute.needsUpdate = true; // required after the first render
```



 If you change the position data values after the initial render, you may need to recompute
 bounding volumes so other features of the engine like view frustum culling or helpers properly work.
 


```js
line.geometry.computeBoundingBox();
line.geometry.computeBoundingSphere();
```



 [link:https://jsfiddle.net/t4m85pLr/1/ Here is a fiddle] showing an animated line which you can adapt to your use case.

 Examples 

 [example:webgl_custom_attributes WebGL / custom / attributes] 
 [example:webgl_buffergeometry_custom_attributes_particles WebGL / buffergeometry / custom / attributes / particles]

 Materials 
 
 All uniforms values can be changed freely (e.g. colors, textures, opacity, etc), values are sent to the shader every frame. 
 
 Also GLstate related parameters can change any time (depthTest, blending, polygonOffset, etc). 
 
 The following properties can't be easily changed at runtime (once the material is rendered at least once): 
 
 numbers and types of uniforms 
 presence or not of
 
 texture 
 fog 
 vertex colors 
 morphing 
 shadow map 
 alpha test 
 transparent 

 Changes in these require building of new shader program. You'll need to set 
 material.needsUpdate = true 
 
 Bear in mind this might be quite slow and induce jerkiness in framerate (especially on Windows, as shader compilation is slower in DirectX than OpenGL). 
 
 For smoother experience you can emulate changes in these features to some degree by having "dummy" values like zero intensity lights, white textures, or zero density fog. 
 
 You can freely change the material used for geometry chunks, however you cannot change how an object is divided into chunks (according to face materials). 
 
 If you need to have different configurations of materials during runtime: 
 If the number of materials / chunks is small, you could pre-divide the object beforehand (e.g. hair / face / body / upper clothes / trousers for a human, front / sides / top / glass / tire / interior for a car). 
 
 If the number is large (e.g. each face could be potentially different), consider a different solution, such as using attributes / textures to drive different per-face look. 
 
 Examples 
 
 [example:webgl_materials_car WebGL / materials / car] 
 [example:webgl_postprocessing_dof WebGL / webgl_postprocessing / dof]

 Textures 
 
 Image, canvas, video and data textures need to have the following flag set if they are changed: 
 
 texture.needsUpdate = true;
 
 Render targets update automatically. 
 
 Examples 
 
 [example:webgl_materials_video WebGL / materials / video] 
 [example:webgl_rtt WebGL / rtt]

 Cameras 
 
 A camera's position and target is updated automatically. If you need to change 

 fov

 aspect

 near

 far

 then you'll need to recompute the projection matrix:
 


```js
camera.aspect = window.innerWidth / window.innerHeight;
camera.updateProjectionMatrix();
```



 InstancedMesh 

 `InstancedMesh` is a class for conveniently access instanced rendering in `three.js`. Certain library features like view frustum culling or
 ray casting rely on up-to-date bounding volumes (bounding sphere and bounding box). Because of the way how `InstancedMesh` works, the class
 has its own `boundingBox` and `boundingSphere` properties that supersede the bounding volumes on geometry level.

 Similar to geometries you have to recompute the bounding box and sphere whenever you change the underlying data. In context of `InstancedMesh`, that
 happens when you transform instances via `setMatrixAt()`. You can use the same pattern like with geometries.
 


```js
instancedMesh.computeBoundingBox();
instancedMesh.computeBoundingSphere();
```



 SkinnedMesh 

 `SkinnedMesh` follows the same principles like `InstancedMesh` in context of bounding volumes. Meaning the class has its own version of
 `boundingBox` and `boundingSphere` to correctly enclose animated meshes.
 When calling `computeBoundingBox()` and `computeBoundingSphere()`, the class computes the respective bounding volumes based on the current
 bone transformation (or in other words the current animation state).
