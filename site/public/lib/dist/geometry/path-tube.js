// lib/geometry/path-tube.ts
// Parallel-transport tube geometry, ported from shaders-fr's procedural neon
// tunnel. parallelTransportFrames rotates one initial frame along the curve
// (no torsion flips, unlike Frenet frames); createPathTube sweeps a circle
// through those frames with a per-point radius function — tunnels, tentacles,
// conduits, roller-coaster rails.
import * as THREE from 'three';
/** Twist-free coordinate frames along a polyline (parallel transport). */
export function parallelTransportFrames(points) {
    const tangents = [];
    const normals = [];
    const binormals = [];
    const size = points.length;
    for (let i = 0; i < size; i++) {
        const prev = points[Math.max(0, i - 1)];
        const next = points[Math.min(size - 1, i + 1)];
        tangents.push(new THREE.Vector3().subVectors(next, prev)
            .normalize());
    }
    // initial frame: any vector not parallel to t0, made perpendicular
    const t0 = tangents[0];
    const n0 = Math.abs(t0.x) < 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    n0.addScaledVector(t0, -t0.dot(n0)).normalize();
    normals.push(n0);
    binormals.push(new THREE.Vector3().crossVectors(t0, n0)
        .normalize());
    // propagate: rotate the previous frame by the tangent-to-tangent rotation
    for (let i = 1; i < size; i++) {
        const tPrev = tangents[i - 1];
        const tCurr = tangents[i];
        const nCurr = normals[i - 1].clone();
        const bCurr = binormals[i - 1].clone();
        const axis = new THREE.Vector3().crossVectors(tPrev, tCurr);
        if (axis.lengthSq() > 1e-8) {
            axis.normalize();
            const angle = Math.acos(Math.max(-1, Math.min(1, tPrev.dot(tCurr))));
            nCurr.applyAxisAngle(axis, angle).normalize();
            bCurr.applyAxisAngle(axis, angle).normalize();
        }
        normals.push(nCurr);
        binormals.push(bCurr);
    }
    return { tangents, normals, binormals };
}
/** Sweep a circle through parallel-transport frames along `points`. */
export function createPathTube(points, { radius = 1, radialSegments = 12, inward = false, vRepeat = 1 } = {}) {
    if (points.length < 2)
        throw new Error('createPathTube: need at least 2 points');
    const { normals, binormals } = parallelTransportFrames(points);
    const radiusAt = typeof radius === 'function' ? radius : () => radius;
    const positions = [];
    const normalArr = [];
    const uvs = [];
    const indices = [];
    const tubularSegments = points.length - 1;
    const sign = inward ? -1 : 1;
    for (let i = 0; i <= tubularSegments; i++) {
        const t = i / tubularSegments;
        const p = points[i];
        const n = normals[i];
        const b = binormals[i];
        const r = radiusAt(t, i);
        for (let j = 0; j <= radialSegments; j++) {
            const angle = j / radialSegments * Math.PI * 2;
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);
            const nx = cos * n.x + sin * b.x;
            const ny = cos * n.y + sin * b.y;
            const nz = cos * n.z + sin * b.z;
            positions.push(p.x + r * nx, p.y + r * ny, p.z + r * nz);
            normalArr.push(sign * nx, sign * ny, sign * nz);
            uvs.push(j / radialSegments, t * vRepeat);
        }
    }
    for (let i = 0; i < tubularSegments; i++)
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j;
            const d = a + radialSegments + 1;
            if (inward)
                indices.push(a, a + 1, d, a + 1, d + 1, d);
            else
                indices.push(a, d, a + 1, a + 1, d, d + 1);
        }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normalArr, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
}
// perf: one-off CPU build — (points × radialSegments) vertices, one draw call.
// The radius function makes bulges/necks free; rebuild only when the path changes.
//# sourceMappingURL=path-tube.js.map