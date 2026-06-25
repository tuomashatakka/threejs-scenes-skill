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
