// lib/props/composite.ts
// Prop composites — assemble several mounted PropInstances into one group with
// relative transforms (e.g. a lamp = post + bulb + light, or a tree cluster).
// The composite owns its parts: one dispose() tears all of them down.
import * as THREE from 'three';
export function createPropComposite(parts) {
    const group = new THREE.Group();
    const instances = parts.map(p => p.prop);
    for (const part of parts) {
        const obj = part.prop.object;
        if (part.position)
            obj.position.fromArray(part.position);
        if (part.rotation)
            obj.rotation.fromArray(part.rotation);
        if (part.scale !== undefined) {
            if (typeof part.scale === 'number')
                obj.scale.setScalar(part.scale);
            else
                obj.scale.fromArray(part.scale);
        }
        group.add(obj);
    }
    return {
        object: group,
        parts: instances,
        dispose() {
            for (const inst of instances)
                inst.dispose();
        },
    };
}
// perf: a composite is just a Group — no extra draw cost. Each part keeps its
// own controller; disposing the composite disposes every part exactly once.
//# sourceMappingURL=composite.js.map