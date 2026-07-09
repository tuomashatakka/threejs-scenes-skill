// lib/core/dispose.ts
// Recursive scene cleanup. Three.js does NOT auto-dispose — call this on
// teardown, route change, or quality-tier change to free GPU memory.
// Ported from scripts/dispose-scene.js.

import type * as THREE from 'three'


function isTexture (val: unknown): val is THREE.Texture {
  return Boolean(
    val &&
    typeof val === 'object' &&
    'minFilter' in val &&
    typeof (val as { dispose?: unknown }).dispose === 'function',
  )
}

/**
 * Dispose a material and every texture it references. Frees all Texture-shaped
 * properties (`map`, `normalMap`, …), every texture-valued shader uniform, and
 * finally the material itself.
 */
export function disposeMaterial (mat: THREE.Material): void {
  // dispose every Texture-shaped property
  for (const key in mat) {
    const val = (mat as unknown as Record<string, unknown>)[key]
    if (isTexture(val))
      val.dispose()
  }

  // dispose every uniform whose value is a Texture
  const shaderMat = mat as THREE.ShaderMaterial
  if (shaderMat.uniforms)
    for (const key in shaderMat.uniforms) {
      const val = shaderMat.uniforms[key]?.value
      if (isTexture(val))
        val.dispose()
    }
  mat.dispose()
}

/**
 * Recursively free GPU resources under `root`: every geometry plus every
 * material (and its textures, via {@link disposeMaterial}). Call on teardown,
 * route change, or quality-tier change — three.js never auto-disposes.
 *
 * @remarks Disposes everything it finds, including shared/pooled materials, so
 * keep pooled resources out of trees you pass here. Does not detach `root`
 * from its parent.
 */
export function disposeScene (root: THREE.Object3D): void {
  root.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry)
      mesh.geometry.dispose()
    if (mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [ mesh.material ]
      for (const mat of materials)
        disposeMaterial(mat)
    }
  })
}

// perf: cheap. Call once on teardown. Without this, GPU memory leaks across
// scene swaps.
