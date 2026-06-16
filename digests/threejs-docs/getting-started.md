<!-- ingested from https://raw.githubusercontent.com/mrdoob/three.js/dev/docs/llms-full.txt (curated llms-full.txt, split manually) -->

# Three.js

> Three.js is a cross-browser JavaScript library for creating 3D graphics using WebGL and WebGPU.

## Instructions for Large Language Models

When generating Three.js code, follow these guidelines:

### 1. Use Import Maps (Not Old CDN Patterns)

WRONG - outdated pattern:
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
```

CORRECT - modern pattern (always use latest version):
```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
</script>
```

### 2. Choosing Between WebGLRenderer and WebGPURenderer

Three.js maintains both renderers:

**Use WebGLRenderer** (default, mature):
- Maximum browser compatibility
- Well-established, many years of development
- Most examples and tutorials use this

```js
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer();
```

**Use WebGPURenderer** when you need:
- Custom shaders/materials using TSL (Three.js Shading Language)
- Compute shaders
- Advanced node-based materials

```js
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer();
await renderer.init();
```

### 3. TSL (Three.js Shading Language)

When using WebGPURenderer, use TSL instead of raw GLSL for custom materials:

```js
import { texture, uv, color } from 'three/tsl';

const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = texture( myTexture ).mul( color( 0xff0000 ) );
```

TSL benefits:
- Works with both WebGL and WebGPU backends
- No string manipulation or onBeforeCompile hacks
- Type-safe, composable shader nodes
- Automatic optimization

### 4. NodeMaterial Classes (for WebGPU/TSL)

When using TSL, use node-based materials:
- MeshBasicNodeMaterial
- MeshStandardNodeMaterial
- MeshPhysicalNodeMaterial
- LineBasicNodeMaterial
- SpriteNodeMaterial

---

## Complete Code Examples

### Basic Scene with WebGLRenderer

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Three.js Basic Scene</title>
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.module.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGLRenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

// Controls
const controls = new OrbitControls( camera, renderer.domElement );

// Lighting
const ambientLight = new THREE.AmbientLight( 0x404040 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set( 5, 5, 5 );
scene.add( directionalLight );

// Mesh
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const material = new THREE.MeshStandardMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// Handle resize
window.addEventListener( 'resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
} );

// Animation loop
function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
</script>
</body>
</html>
```

### Basic Scene with WebGPURenderer and TSL

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Three.js WebGPU Scene</title>
  <style>
    body { margin: 0; }
  </style>
</head>
<body>
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.webgpu.js",
    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.184.0/build/three.tsl.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.184.0/examples/jsm/"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
import { color, positionLocal, sin, time } from 'three/tsl';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 5;

// Renderer
const renderer = new THREE.WebGPURenderer( { antialias: true } );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

await renderer.init();

// Controls
const controls = new OrbitControls( camera, renderer.domElement );

// Lighting
const ambientLight = new THREE.AmbientLight( 0x404040 );
scene.add( ambientLight );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
directionalLight.position.set( 5, 5, 5 );
scene.add( directionalLight );

// Custom TSL material
const material = new THREE.MeshStandardNodeMaterial();
material.colorNode = color( 0x00ff00 ).mul( sin( time ).mul( 0.5 ).add( 0.5 ) );
material.positionNode = positionLocal.add( sin( time.add( positionLocal.y ) ).mul( 0.1 ) );

// Mesh
const geometry = new THREE.BoxGeometry( 1, 1, 1 );
const cube = new THREE.Mesh( geometry, material );
scene.add( cube );

// Handle resize
window.addEventListener( 'resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
} );

// Animation loop
function animate() {
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  controls.update();
  renderer.render( scene, camera );
}
renderer.setAnimationLoop( animate );
</script>
</body>
</html>
```

### Loading a GLTF Model

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

loader.load(
  'model.glb',
  ( gltf ) => {
    scene.add( gltf.scene );
  },
  ( progress ) => {
    console.log( ( progress.loaded / progress.total * 100 ) + '% loaded' );
  },
  ( error ) => {
    console.error( 'Error loading model:', error );
  }
);
```

---

