// lib/geometry/extrude.ts
// Extruded meshes from 2D shapes/points. createExtrudedMesh wraps
// ExtrudeGeometry with sane bevel defaults; extrudeAlongPath sweeps a profile
// along a 3D curve. Pair with shapes.ts for bespoke silhouettes.
import * as THREE from 'three';
function pointsToShape(points) {
    const s = new THREE.Shape();
    points.forEach(([x, y], i) => i === 0 ? s.moveTo(x, y) : s.lineTo(x, y));
    return s;
}
export function createExtrudedMesh(options) {
    const { shape, points, depth = 1, bevel = true, bevelThickness = 0.05, bevelSize = 0.05, bevelSegments = 2, steps = 1, curveSegments = 12, material = new THREE.MeshStandardMaterial({ color: '#9aa7b5', roughness: 0.6, metalness: 0.1 }), } = options;
    const profile = shape ?? (points ? pointsToShape(points) : null);
    if (!profile)
        throw new Error('createExtrudedMesh: provide `shape` or `points`');
    const geometry = new THREE.ExtrudeGeometry(profile, {
        depth,
        bevelEnabled: bevel,
        bevelThickness,
        bevelSize,
        bevelSegments,
        steps,
        curveSegments,
    });
    geometry.center();
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}
export function extrudeAlongPath(shape, path, options = {}) {
    const { steps = 64, bevel = false, curveSegments = 12, material = new THREE.MeshStandardMaterial({ color: '#9aa7b5', roughness: 0.6 }), } = options;
    const geometry = new THREE.ExtrudeGeometry(shape, {
        steps,
        bevelEnabled: bevel,
        curveSegments,
        extrudePath: path,
    });
    geometry.computeVertexNormals();
    return new THREE.Mesh(geometry, material);
}
// perf: medium. ExtrudeGeometry triangulates on the CPU at build time; the mesh
// renders as one draw call. Dispose geometry + material on teardown.
//# sourceMappingURL=extrude.js.map