// lib/post/webgpu/ca.ts
// Chromatic aberration — splits R/G/B radially for a lens-fringing look. Wraps
// three's ChromaticAberrationNode. Pattern: COLOUR-INPUT effect. The example
// feeds it `renderOutput(scenePass)` so the split happens in display space.
import * as THREE from 'three';
import { uniform } from 'three/tsl';
import { chromaticAberration } from 'three/addons/tsl/display/ChromaticAberrationNode.js';
export function createChromaticAberration(input, options = {}) {
    const { strength = 1, center = new THREE.Vector2(0.5, 0.5), scale = 1.2 } = options;
    return chromaticAberration(input, uniform(strength), uniform(center), uniform(scale));
}
// perf: low. Three texture taps with a radial offset.
//# sourceMappingURL=ca.js.map