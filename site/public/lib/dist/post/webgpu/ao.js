// lib/post/webgpu/ao.ts
// Ambient occlusion (GTAO) — contact shadows in creases. Wraps three's GTAONode.
// Pattern: GEOMETRY-AWARE effect. Needs depth + normal from an MRT scene pass
// (see createScenePassMRT) and the camera. Multiply onto the scene colour.
import { ao } from 'three/addons/tsl/display/GTAONode.js';
export function createAo(viewZ, normal, camera) {
    return ao(viewZ, normal, camera);
}
// perf: high. Hemisphere sampling per pixel; gate off on low-end devices.
//# sourceMappingURL=ao.js.map