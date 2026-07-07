// lib/props/instanced-prop.ts
// Instance a prop N times. If the prop builds to a single Mesh we route through
// createInstancedField (one draw call for the whole field). Otherwise we fall
// back to cloning the built group per instance (still cheap for low counts).
import * as THREE from 'three';
import { createInstancedField } from '../instancing/instanced-field.js';
import { disposeScene } from '../core/dispose.js';
import { mulberry32 } from '../procedural/rng.js';
const scratch = new THREE.Object3D();
export function createInstancedProp(factory, options, ctx = {}) {
    const merged = { ...factory.instanced, ...options };
    const { count, radius = 10, seed = 1, place } = merged;
    const sample = factory.build(ctx);
    if (sample instanceof THREE.Mesh) {
        const mesh = createInstancedField({
            geometry: sample.geometry,
            material: sample.material,
            count,
            radius,
            seed,
            place,
        });
        return {
            object: mesh,
            dispose() {
                mesh.geometry.dispose();
                const mat = mesh.material;
                mat.dispose();
                mesh.dispose();
            },
        };
    }
    // group fallback — clone per instance, place with the same callback contract.
    const group = new THREE.Group();
    const rng = mulberry32(seed);
    const color = new THREE.Color();
    for (let i = 0; i < count; i++) {
        const clone = sample.clone();
        if (place) {
            place(i, rng, scratch, color);
            clone.position.copy(scratch.position);
            clone.quaternion.copy(scratch.quaternion);
            clone.scale.copy(scratch.scale);
        }
        else {
            const angle = rng() * Math.PI * 2;
            const dist = Math.sqrt(rng()) * radius;
            clone.position.set(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
            clone.rotation.y = rng() * Math.PI * 2;
        }
        group.add(clone);
    }
    disposeScene(sample);
    return {
        object: group,
        dispose() {
            disposeScene(group);
        },
    };
}
// perf: single-mesh props -> 1 draw call regardless of count. Group fallback is
// N draw calls (× the prop's mesh count) — keep counts modest or merge first.
//# sourceMappingURL=instanced-prop.js.map