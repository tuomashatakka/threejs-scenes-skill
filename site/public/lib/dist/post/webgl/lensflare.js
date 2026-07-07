// lib/post/webgl/lensflare.ts
// Lens flare. NOTE: unlike the WebGPU `webgpu/lensflare.ts` (a post node added to
// the output graph), the WebGL addon flare is a SCENE OBJECT you attach to a
// light — `three/addons/objects/Lensflare`. It renders the ghost/halo sprites
// from the light's screen position with occlusion testing. Add the returned
// object to a light: `light.add(createLensflare({ elements }))`.
import * as THREE from 'three';
import { Lensflare, LensflareElement } from 'three/addons/objects/Lensflare.js';
export function createLensflare(options = {}) {
    const flare = new Lensflare();
    for (const e of options.elements ?? [])
        flare.addElement(new LensflareElement(e.texture, e.size ?? 100, e.distance ?? 0, e.color ?? new THREE.Color(0xffffff)));
    return flare;
}
// perf: low-medium. GPU occlusion query per flare; a handful of textured quads.
//# sourceMappingURL=lensflare.js.map