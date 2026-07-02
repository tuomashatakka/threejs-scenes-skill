// lib/core/projection.ts
// World -> screen projection for effect targeting: feed a selected object's
// screen UV to lens-flare / lensing / vortex uniforms each frame, and skip the
// effect when the object is off-screen or behind the camera.
import * as THREE from 'three';
const scratch = new THREE.Vector3();
const scratchView = new THREE.Vector3();
export function projectToScreenUv(object, camera, out = { u: 0, v: 0, ndcZ: 0, onScreen: false }) {
    object.getWorldPosition(scratch);
    // behind-the-camera check must happen in view space: project() folds points
    // behind the eye back into valid-looking NDC.
    const behind = scratchView.copy(scratch).applyMatrix4(camera.matrixWorldInverse).z > 0;
    scratch.project(camera);
    out.u = scratch.x * 0.5 + 0.5;
    out.v = scratch.y * 0.5 + 0.5;
    out.ndcZ = scratch.z;
    out.onScreen = !behind && out.u >= 0 && out.u <= 1 && out.v >= 0 && out.v <= 1;
    return out;
}
// perf: cheap. module-scope scratch vectors, zero per-frame alloc when a
// reused `out` is passed.
//# sourceMappingURL=projection.js.map