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
