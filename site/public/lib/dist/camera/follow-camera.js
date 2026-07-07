// lib/camera/follow-camera.ts
// Third-person follow camera with framerate-independent damping. Wires into the
// CameraController interface for interchangeable control.
import * as THREE from 'three';
import { tupleToVector3 } from './targets.js';
const scratchTargetPos = new THREE.Vector3();
const scratchLookAt = new THREE.Vector3();
const scratchDesired = new THREE.Vector3();
export function createFollowCamera(camera, target, { offset, lookAhead = new THREE.Vector3(), stiffness = 8, rotationStiffness = 6, }) {
    if (!offset)
        throw new Error('createFollowCamera: offset is required');
    let currentTarget = target;
    const currentOffset = offset.clone();
    const currentLookAhead = lookAhead.clone();
    let mode = 'follow';
    const update = ({ delta }) => {
        if (mode !== 'follow' || !currentTarget)
            return;
        currentTarget.getWorldPosition(scratchTargetPos);
        scratchDesired
            .copy(currentOffset)
            .applyQuaternion(currentTarget.quaternion)
            .add(scratchTargetPos);
        const tPos = 1 - Math.exp(-stiffness * delta);
        camera.position.lerp(scratchDesired, tPos);
        scratchLookAt
            .copy(currentLookAhead)
            .applyQuaternion(currentTarget.quaternion)
            .add(scratchTargetPos);
        const tLook = 1 - Math.exp(-rotationStiffness * delta);
        scratchLookAt.lerp(scratchTargetPos, tLook);
        camera.lookAt(scratchLookAt);
    };
    return {
        camera,
        mode: () => mode,
        follow(object, nextOffset) {
            currentTarget = object;
            if (nextOffset)
                currentOffset.set(nextOffset[0], nextOffset[1], nextOffset[2]);
            mode = 'follow';
        },
        free() {
            mode = 'free';
        },
        flyTo(_position, _lookAt, _options) {
            // Free camera to allow fly-to or no-op
            mode = 'free';
        },
        cockpit(_rig) {
            mode = 'cockpit';
        },
        setFov(_fov) {
            // Perspective-specific, no-op for generic camera
        },
        setBounds(_bounds) {
            // No-op
        },
        snapTo(position, lookAt) {
            tupleToVector3(position, camera.position);
            tupleToVector3(lookAt, scratchLookAt);
            camera.lookAt(scratchLookAt);
            mode = 'free';
        },
        isMoving: () => mode !== 'free',
        update,
    };
}
//# sourceMappingURL=follow-camera.js.map