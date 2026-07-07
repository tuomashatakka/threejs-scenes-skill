// lib/geometry/modifiers.ts
// BufferGeometry modifiers. Two families:
//  1. vertex deformers (twist/taper/bend/noise) — mutate the position attribute
//     in place, then recompute normals. Cheap, deterministic, build-time only.
//  2. thin wrappers over three/addons utilities (simplify/tessellate/edge-split/
//     merge-vertices) that return a new geometry.
// All deformers mutate and return the *same* geometry for chaining.
import * as THREE from 'three';
import { SimplifyModifier } from 'three/addons/modifiers/SimplifyModifier.js';
import { TessellateModifier } from 'three/addons/modifiers/TessellateModifier.js';
import { EdgeSplitModifier } from 'three/addons/modifiers/EdgeSplitModifier.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { hash3 } from '../procedural/rng.js';
function axisExtent(geo, axis) {
    geo.computeBoundingBox();
    const box = geo.boundingBox;
    const min = box.min[axis];
    const size = Math.max(1e-6, box.max[axis] - min);
    return { min, size };
}
const scratch = new THREE.Vector3();
/** Twist around `axis`: rotation grows linearly from 0 to `angle` along the axis. */
export function applyTwist(geo, angle, axis = 'y') {
    const pos = geo.getAttribute('position');
    const { min, size } = axisExtent(geo, axis);
    for (let i = 0; i < pos.count; i++) {
        scratch.fromBufferAttribute(pos, i);
        const t = (scratch[axis] - min) / size;
        const a = angle * t;
        const c = Math.cos(a);
        const s = Math.sin(a);
        if (axis === 'y') {
            const x = scratch.x * c - scratch.z * s;
            const z = scratch.x * s + scratch.z * c;
            scratch.x = x;
            scratch.z = z;
        }
        else if (axis === 'x') {
            const y = scratch.y * c - scratch.z * s;
            const z = scratch.y * s + scratch.z * c;
            scratch.y = y;
            scratch.z = z;
        }
        else {
            const x = scratch.x * c - scratch.y * s;
            const y = scratch.x * s + scratch.y * c;
            scratch.x = x;
            scratch.y = y;
        }
        pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}
/** Taper: the two axes perpendicular to `axis` scale from 1 to `factor` along it. */
export function applyTaper(geo, factor, axis = 'y') {
    const pos = geo.getAttribute('position');
    const { min, size } = axisExtent(geo, axis);
    for (let i = 0; i < pos.count; i++) {
        scratch.fromBufferAttribute(pos, i);
        const t = (scratch[axis] - min) / size;
        const scale = 1 + (factor - 1) * t;
        if (axis !== 'x')
            scratch.x *= scale;
        if (axis !== 'y')
            scratch.y *= scale;
        if (axis !== 'z')
            scratch.z *= scale;
        pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}
/** Bend the geometry into an arc of `angle` radians around its `axis` extent. */
export function applyBend(geo, angle, axis = 'x') {
    if (Math.abs(angle) < 1e-6)
        return geo;
    const pos = geo.getAttribute('position');
    const { min, size } = axisExtent(geo, axis);
    const radius = size / angle;
    for (let i = 0; i < pos.count; i++) {
        scratch.fromBufferAttribute(pos, i);
        const t = (scratch[axis] - min) / size - 0.5;
        const theta = t * angle;
        // bend in the plane of `axis` and Y (or Z when axis is y).
        const bendInto = axis === 'y' ? 'z' : 'y';
        const r = radius + scratch[bendInto];
        scratch[axis] = Math.sin(theta) * r;
        scratch[bendInto] = Math.cos(theta) * r - radius;
        pos.setXYZ(i, scratch.x, scratch.y, scratch.z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}
/** Push each vertex along its normal by seeded value noise. Great for rocks/terrain. */
export function displaceByNoise(geo, options = {}) {
    const { amp = 0.2, freq = 1.5 } = options;
    const seed = options.rng ? options.rng.next() * 1000 : options.seed ?? 0;
    if (!geo.getAttribute('normal'))
        geo.computeVertexNormals();
    const pos = geo.getAttribute('position');
    const nor = geo.getAttribute('normal');
    for (let i = 0; i < pos.count; i++) {
        scratch.fromBufferAttribute(pos, i);
        const n = hash3(scratch.x * freq + seed, scratch.y * freq + seed, scratch.z * freq + seed) - 0.5;
        const d = n * 2 * amp;
        pos.setXYZ(i, scratch.x + nor.getX(i) * d, scratch.y + nor.getY(i) * d, scratch.z + nor.getZ(i) * d);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    return geo;
}
// --- addon wrappers (return a NEW geometry) ---
/** Collapse to roughly `targetCount` vertices via SimplifyModifier. */
export function simplifyGeometry(geo, targetCount) {
    return new SimplifyModifier().modify(geo, targetCount);
}
/** Subdivide long edges. `maxEdgeLength` in world units, `iterations` passes. */
export function tessellateGeometry(geo, maxEdgeLength = 0.1, iterations = 6) {
    return new TessellateModifier(maxEdgeLength, iterations).modify(geo);
}
/** Split shared vertices across hard edges so flat-shaded creases stay sharp. */
export function edgeSplit(geo, cutOffAngleRad = Math.PI / 6, keepNormals = false) {
    return new EdgeSplitModifier().modify(geo, cutOffAngleRad, keepNormals);
}
/** Weld duplicate vertices within `tolerance` (indexes the geometry). */
export function mergeVertices(geo, tolerance = 1e-4) {
    return BufferGeometryUtils.mergeVertices(geo, tolerance);
}
export function recomputeNormals(geo) {
    geo.computeVertexNormals();
    return geo;
}
// perf: deformers are O(vertices), run once at build. Simplify/tessellate are
// heavier — do them offline or at load, never per frame.
//# sourceMappingURL=modifiers.js.map