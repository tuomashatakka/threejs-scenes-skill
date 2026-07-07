// lib/camera/path-camera.ts
// On-rails camera with pointer look-around, ported from shaders-fr's
// CameraRig. Advances a distance along a curve, looks down the tangent, and
// layers an exp-smoothed yaw/pitch pan driven by pointer position — the pan
// recenters when the pointer lifts. Uses getPoint (parameter-based), not
// getPointAt: the arc-length cache can NaN out on freshly rebuilt curves.
import * as THREE from 'three';
export function createPathCamera(camera, path, element, { yawRange = 0.25, pitchRange = 0.18, smoothing = 6, speed = 2 } = {}) {
    let targetYaw = 0;
    let targetPitch = 0;
    let yaw = 0;
    let pitch = 0;
    const onMove = (e) => {
        const nx = e.clientX / window.innerWidth * 2 - 1;
        const ny = e.clientY / window.innerHeight * 2 - 1;
        targetYaw = -nx * yawRange;
        targetPitch = -ny * pitchRange;
    };
    const onUp = () => {
        targetYaw = 0;
        targetPitch = 0;
    };
    element.addEventListener('pointermove', onMove);
    element.addEventListener('pointerup', onUp);
    element.addEventListener('pointercancel', onUp);
    const pos = new THREE.Vector3();
    const ahead = new THREE.Vector3();
    const tangent = new THREE.Vector3();
    const look = new THREE.Vector3();
    const rig = {
        distance: 0,
        update({ delta }, speedOverride) {
            rig.distance += delta * (speedOverride ?? speed);
            const { curve, total } = path;
            if (total <= 0.001 || !curve || curve.points && curve.points.length < 2)
                return;
            const d = Math.min(rig.distance, total - 0.01);
            const u = Math.max(0, Math.min(d / total, 0.999));
            curve.getPoint(u, pos);
            curve.getPoint(Math.min(u + 0.002, 1), ahead);
            tangent.subVectors(ahead, pos);
            if (tangent.lengthSq() < 1e-6)
                tangent.set(0, 0, 1);
            tangent.normalize();
            camera.position.copy(pos);
            const k = 1 - Math.exp(-delta * smoothing);
            yaw += (targetYaw - yaw) * k;
            pitch += (targetPitch - pitch) * k;
            look.copy(pos).add(tangent);
            camera.lookAt(look);
            camera.rotateY(yaw);
            camera.rotateX(pitch);
        },
        dispose() {
            element.removeEventListener('pointermove', onMove);
            element.removeEventListener('pointerup', onUp);
            element.removeEventListener('pointercancel', onUp);
        },
    };
    return rig;
}
// perf: cheap — two curve samples and four temp vectors per frame, zero
// allocations in update(). Pairs with createSegmentStream for endless rails.
//# sourceMappingURL=path-camera.js.map