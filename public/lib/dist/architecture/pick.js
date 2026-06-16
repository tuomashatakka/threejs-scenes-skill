// lib/architecture/pick.ts
// Raycast + walk-to-scene-direct-child introspection. Tag top-level objects
// with obj.userData.module = name when adding them; a click-to-inspect
// raycaster then walks object.parent up to the scene's direct child and maps a
// hit back to its owning module — no separate registry needed
// (the metadata-tagging lesson in production-lessons.md).
import * as THREE from 'three';
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
export function pickTopLevel(scene, camera, ndcX, ndcY, isPickable) {
    pointer.set(ndcX, ndcY);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(scene.children, true);
    for (const hit of hits) {
        if (isPickable && !isPickable(hit.object))
            continue;
        // walk up to the scene's direct child.
        let top = hit.object;
        while (top.parent && top.parent !== scene)
            top = top.parent;
        return { object: hit.object, topLevel: top, point: hit.point, distance: hit.distance };
    }
    return null;
}
// perf: medium. raycast cost scales with scene depth; gate behind pointer taps.
//# sourceMappingURL=pick.js.map