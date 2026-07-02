// lib/procedural/segment-stream.ts
// Endless streaming world along a stitched path, generalized from shaders-fr's
// PathBuilder + RoomQueue. Append segments (any Object3D with local path
// control points and an exit); each is world-aligned so its local entrance
// tangent (+z) continues the previous segment's exit tangent, the shared
// CatmullRom curve is rebuilt, and the oldest segments beyond maxActive are
// evicted and disposed. Memory stays constant while the path grows forever.
// Drive a createPathCamera from the resulting { curve, total }.
import * as THREE from 'three';
function tupleToVec(v) {
    return new THREE.Vector3(v[0], v[1], v[2]);
}
function quatFromTangents(from, to) {
    const f = from.clone();
    f.y = 0;
    if (f.lengthSq() < 1e-6)
        f.set(0, 0, 1);
    f.normalize();
    const t = to.clone();
    t.y = 0;
    if (t.lengthSq() < 1e-6)
        t.set(0, 0, 1);
    t.normalize();
    return new THREE.Quaternion().setFromUnitVectors(f, t);
}
export function createSegmentStream(scene, { maxActive = 4, lift = 1.6, tension = 0.5 } = {}) {
    const segments = [];
    const worldPoints = new Map();
    let totalLength = 0;
    let appended = 0;
    const stream = {
        curve: new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, lift, -0.01),
            new THREE.Vector3(0, lift, 0),
        ]),
        get total() {
            return totalLength;
        },
        segments,
        get appended() {
            return appended;
        },
        append,
        indexAt,
        dispose() {
            for (const seg of segments) {
                scene.remove(seg.input.object);
                seg.input.dispose?.();
            }
            segments.length = 0;
            worldPoints.clear();
        },
    };
    function rebuildCurve() {
        const pts = [];
        for (const seg of segments)
            for (const p of worldPoints.get(seg) ?? [])
                if (pts.length === 0 || pts[pts.length - 1].distanceToSquared(p) > 1e-4)
                    pts.push(p);
        if (pts.length < 2) {
            pts.push(new THREE.Vector3(0, lift, 0));
            pts.push(new THREE.Vector3(0, lift, 1));
        }
        stream.curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', tension);
    }
    function append(input) {
        let worldOffset;
        let worldRotation;
        if (segments.length === 0) {
            worldOffset = new THREE.Vector3();
            worldRotation = new THREE.Quaternion();
        }
        else {
            const prev = segments[segments.length - 1];
            // Align this segment's local entrance tangent (+z) with prev's exit tangent.
            worldRotation = quatFromTangents(new THREE.Vector3(0, 0, 1), prev.worldExitTangent);
            worldOffset = prev.worldExit.clone();
        }
        input.object.position.copy(worldOffset);
        input.object.quaternion.copy(worldRotation);
        const toWorld = (lp) => tupleToVec(lp).applyQuaternion(worldRotation)
            .add(worldOffset);
        const lifted = input.pathPoints.map(p => toWorld(p).add(new THREE.Vector3(0, lift, 0)));
        const worldExit = toWorld(input.exit.position);
        const worldExitTangent = tupleToVec(input.exit.tangent).applyQuaternion(worldRotation)
            .normalize();
        let segLen = 0;
        for (let i = 1; i < lifted.length; i++)
            segLen += lifted[i].distanceTo(lifted[i - 1]);
        const segment = {
            input,
            startT: totalLength,
            endT: totalLength + segLen,
            length: segLen,
            worldExit,
            worldExitTangent,
        };
        totalLength = segment.endT;
        segments.push(segment);
        worldPoints.set(segment, lifted);
        scene.add(input.object);
        appended += 1;
        while (segments.length > maxActive) {
            const old = segments.shift();
            worldPoints.delete(old);
            scene.remove(old.input.object);
            old.input.dispose?.();
        }
        rebuildCurve();
        return segment;
    }
    function indexAt(distance) {
        for (let i = 0; i < segments.length; i++)
            if (distance <= segments[i].endT)
                return i;
        return segments.length - 1;
    }
    return stream;
}
// perf: append is the only cost (curve rebuild over ≤maxActive segments'
// points). Steady-state per-frame cost is zero — the stream only changes when
// you append. Keep maxActive small; evicted segments must dispose their GPU
// resources via input.dispose.
//# sourceMappingURL=segment-stream.js.map