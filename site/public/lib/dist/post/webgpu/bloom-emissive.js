// lib/post/webgpu/bloom-emissive.ts
// Emissive bloom — blooms only the emissive contribution of PBR materials, so
// glowing parts shine without washing out lit surfaces. MRT composition around
// BloomNode (example: webgpu_postprocessing_bloom_emissive). Pattern:
// SCENE-PASS + MRT exposing an `emissive` channel.
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
// `scenePass` must expose an `emissive` MRT channel (see readme wiring note).
// Returns { output, bloom, result }; use `result` (= output + bloom) as output.
export function createBloomEmissive(scenePass, options = {}) {
    const { strength = 2.5, radius = 0.5, threshold = 0 } = options;
    const output = scenePass.getTextureNode('output');
    const emissivePass = scenePass.getTextureNode('emissive');
    const bloomPass = bloom(emissivePass, strength, radius, threshold);
    return { output, bloom: bloomPass, result: output.add(bloomPass) };
}
// perf: medium. One extra emissive MRT attachment plus the bloom blur.
//# sourceMappingURL=bloom-emissive.js.map