// lib/geometry/infinite-ground.ts
// Recentering tiled terrain: a fixed pool of displaced plane tiles that follow
// a moving center (camera/player). Tiles whose grid cell scrolls out of range
// are re-positioned and re-displaced on the far side — memory stays constant
// while the world feels endless. Displacement samples WORLD coordinates so
// tile seams line up. From stellar-cartogrph's SurfaceViewRenderer.
import * as THREE from 'three';
export function createInfiniteGround({ tileSize = 32, gridRadius = 2, segments = 32, displace = () => 0, material, } = {}) {
    const group = new THREE.Group();
    const mat = material ?? new THREE.MeshStandardMaterial({ color: '#3a4a3f', roughness: 1 });
    const ownsMaterial = !material;
    const side = gridRadius * 2 + 1;
    const tiles = [];
    function displaceTile(tile) {
        const geometry = tile.mesh.geometry;
        const position = geometry.getAttribute('position');
        const originX = tile.cellX * tileSize;
        const originZ = tile.cellZ * tileSize;
        for (let i = 0; i < position.count; i++) {
            // plane is rotated -90° around X: local (x, y) -> world (x, -y=z)
            const wx = originX + position.getX(i);
            const wz = originZ - position.getY(i);
            position.setZ(i, displace(wx, wz));
        }
        position.needsUpdate = true;
        geometry.computeVertexNormals();
        tile.mesh.position.set(originX, 0, originZ);
    }
    for (let gx = -gridRadius; gx <= gridRadius; gx++)
        for (let gz = -gridRadius; gz <= gridRadius; gz++) {
            const geometry = new THREE.PlaneGeometry(tileSize, tileSize, segments, segments);
            const mesh = new THREE.Mesh(geometry, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.receiveShadow = true;
            const tile = { mesh, cellX: gx, cellZ: gz };
            displaceTile(tile);
            tiles.push(tile);
            group.add(mesh);
        }
    function update(center) {
        const centerCellX = Math.round(center.x / tileSize);
        const centerCellZ = Math.round(center.z / tileSize);
        for (const tile of tiles) {
            // wrap each tile into the window around the center cell
            let dx = tile.cellX - centerCellX;
            let dz = tile.cellZ - centerCellZ;
            let moved = false;
            while (dx > gridRadius) {
                tile.cellX -= side;
                dx -= side;
                moved = true;
            }
            while (dx < -gridRadius) {
                tile.cellX += side;
                dx += side;
                moved = true;
            }
            while (dz > gridRadius) {
                tile.cellZ -= side;
                dz -= side;
                moved = true;
            }
            while (dz < -gridRadius) {
                tile.cellZ += side;
                dz += side;
                moved = true;
            }
            if (moved)
                displaceTile(tile);
        }
    }
    return {
        object: group,
        update,
        heightAt: (x, z) => displace(x, z),
        dispose() {
            for (const tile of tiles)
                tile.mesh.geometry.dispose();
            if (ownsMaterial)
                mat.dispose();
        },
    };
}
// perf: medium. steady state is free; each recenter re-displaces only the
// wrapped tiles (O(segments²) each). Keep segments ≤ 64.
//# sourceMappingURL=infinite-ground.js.map