// lib/procedural/body.ts
// Procedural celestial bodies: noise-displaced icosphere terrestrials with
// height-palette vertex colours, banded gas giants, water/cloud shells and
// rings. Fully seeded (same spec -> same planet), texture-free (vertex colours
// only) so it works headless and ships zero assets. Generalized from
// stellar-cartogrph's PlanetViewRenderer.
import * as THREE from 'three';
import { createNoise3D } from './noise.js';
const colorA = new THREE.Color();
export function createProceduralBody({ radius = 1, detail = 4, seed = 1, type = 'terrestrial', displacement = 0.06, frequency = 1.6, octaves = 5, ridged = false, palette = { low: '#2d6a4f', mid: '#8a7f5c', high: '#e8e6e0' }, water = { level: 0, color: '#1d4e89' }, clouds = { coverage: 0.5, color: '#ffffff' }, rings = null, } = {}) {
    const group = new THREE.Group();
    const noise = createNoise3D(seed);
    const owned = [];
    // --- surface ---
    const geometry = new THREE.IcosahedronGeometry(radius, detail);
    const position = geometry.getAttribute('position');
    const colors = new Float32Array(position.count * 3);
    const vertex = new THREE.Vector3();
    const low = new THREE.Color(palette.low);
    const mid = new THREE.Color(palette.mid);
    const high = new THREE.Color(palette.high);
    for (let i = 0; i < position.count; i++) {
        vertex.fromBufferAttribute(position, i).normalize();
        let h;
        if (type === 'gas') {
            // latitude bands, warped by low-frequency noise
            const warp = noise.fbm(vertex.x * 2, vertex.y * 2, vertex.z * 2, 3) * 0.3;
            h = Math.sin((vertex.y + warp) * 9) * 0.5 + 0.5;
        }
        else {
            const n = ridged
                ? noise.ridged(vertex.x * frequency, vertex.y * frequency, vertex.z * frequency, octaves) * 2 - 1
                : noise.fbm(vertex.x * frequency, vertex.y * frequency, vertex.z * frequency, octaves);
            h = THREE.MathUtils.clamp(n * 0.5 + 0.5, 0, 1);
            position.setXYZ(i, ...vertex.multiplyScalar(radius * (1 + Math.max(0, n) * displacement)).toArray());
        }
        // two-stop gradient: low->mid below 0.5, mid->high above
        if (h < 0.5)
            colorA.lerpColors(low, mid, h * 2);
        else
            colorA.lerpColors(mid, high, (h - 0.5) * 2);
        colors[i * 3 + 0] = colorA.r;
        colors[i * 3 + 1] = colorA.g;
        colors[i * 3 + 2] = colorA.b;
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    const surfaceMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
    const surface = new THREE.Mesh(geometry, surfaceMaterial);
    group.add(surface);
    owned.push(geometry, surfaceMaterial);
    // --- water shell ---
    if (type === 'terrestrial' && water) {
        const waterGeo = new THREE.IcosahedronGeometry(radius * (1 + water.level * displacement), Math.min(detail, 3));
        const waterMat = new THREE.MeshStandardMaterial({
            color: water.color,
            transparent: true,
            opacity: 0.82,
            roughness: 0.2,
            metalness: 0.1,
        });
        group.add(new THREE.Mesh(waterGeo, waterMat));
        owned.push(waterGeo, waterMat);
    }
    // --- cloud shell: faces below coverage collapse to degenerate (invisible) ---
    let cloudMesh = null;
    if (clouds) {
        const coverage = clouds.coverage ?? 0.5;
        const cloudGeo = new THREE.IcosahedronGeometry(radius * 1.04, Math.min(detail, 3)).toNonIndexed();
        const cloudPos = cloudGeo.getAttribute('position');
        const cloudNoise = createNoise3D(seed + 101);
        const a = new THREE.Vector3();
        const b = new THREE.Vector3();
        const c = new THREE.Vector3();
        for (let f = 0; f < cloudPos.count; f += 3) {
            a.fromBufferAttribute(cloudPos, f);
            b.fromBufferAttribute(cloudPos, f + 1);
            c.fromBufferAttribute(cloudPos, f + 2);
            const n = cloudNoise.fbm(a.x * 2 / radius, a.y * 2 / radius, a.z * 2 / radius, 4);
            if (n * 0.5 + 0.5 > coverage) {
                // collapse the face: zero area = not rasterized
                cloudPos.setXYZ(f + 1, a.x, a.y, a.z);
                cloudPos.setXYZ(f + 2, a.x, a.y, a.z);
            }
        }
        cloudGeo.computeVertexNormals();
        const cloudMat = new THREE.MeshStandardMaterial({
            color: clouds.color ?? '#ffffff',
            transparent: true,
            opacity: 0.65,
            roughness: 1,
        });
        cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
        group.add(cloudMesh);
        owned.push(cloudGeo, cloudMat);
    }
    // --- rings ---
    if (rings) {
        const ringGeo = new THREE.RingGeometry(radius * rings.inner, radius * rings.outer, 96, 1);
        const ringMat = new THREE.MeshBasicMaterial({
            color: rings.color ?? '#c2b280',
            transparent: true,
            opacity: 0.45,
            side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2 - 0.12;
        group.add(ring);
        owned.push(ringGeo, ringMat);
    }
    return {
        object: group,
        tick({ delta }) {
            surface.rotation.y += delta * 0.02;
            if (cloudMesh)
                cloudMesh.rotation.y += delta * 0.033;
        },
        dispose() {
            for (const resource of owned)
                resource.dispose();
        },
    };
}
// perf: build-time cost only (noise per vertex, detail 4 ≈ 2.5k verts).
// Per-frame cost is two rotations.
//# sourceMappingURL=body.js.map