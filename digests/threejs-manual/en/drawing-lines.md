<!-- ingested from https://threejs.org/manual/en/drawing-lines.html (direct markdown, no model) -->

Drawing Lines 

 Let's say you want to draw a line or a circle, not a wireframe `Mesh`.
 First we need to set up the renderer, scene and camera (see the Creating a scene page).

 Here is the code that we will use: 


```js
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );

const scene = new THREE.Scene();
```


 Next thing we will do is define a material. For lines we have to use `LineBasicMaterial` or `LineDashedMaterial`. 


```js
//create a blue LineBasicMaterial
const material = new THREE.LineBasicMaterial( { color: 0x0000ff } );
```



 After material we will need a geometry with some vertices:



```js
const points = [];
points.push( new THREE.Vector3( - 10, 0, 0 ) );
points.push( new THREE.Vector3( 0, 10, 0 ) );
points.push( new THREE.Vector3( 10, 0, 0 ) );

const geometry = new THREE.BufferGeometry().setFromPoints( points );
```


 
 Note that lines are drawn between each consecutive pair of vertices, but not between the first and last (the line is not closed.) 
 
 Now that we have points for two lines and a material, we can put them together to form a line. 


```js
const line = new THREE.Line( geometry, material );
```


 All that's left is to add it to the scene and call `renderer.render()`. 
 


```js
scene.add( line );
renderer.render( scene, camera );
```


 
 You should now be seeing an arrow pointing upwards, made from two blue lines.
