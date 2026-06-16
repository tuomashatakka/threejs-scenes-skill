// scripts/dispose-scene.js
// Recursive scene cleanup. Three.js does NOT auto-dispose — call this on
// teardown, route change, or quality-tier change to free GPU memory.

export function disposeScene (root) {
  root.traverse(obj => {
    if (obj.geometry)
      obj.geometry.dispose()
    if (obj.material) {
      const materials = Array.isArray(obj.material) ? obj.material : [ obj.material ]
      for (const mat of materials)
        disposeMaterial(mat)
    }
  })
}

export function disposeMaterial (mat) {
  // dispose every Texture-shaped property
  for (const key in mat) {
    const val = mat[key]
    if (val && typeof val === 'object' && 'minFilter' in val && typeof val.dispose === 'function')
      val.dispose()
  }
  // dispose every uniform whose value is a Texture
  if (mat.uniforms)
    for (const key in mat.uniforms) {
      const val = mat.uniforms[key]?.value
      if (val && typeof val === 'object' && 'minFilter' in val && typeof val.dispose === 'function')
        val.dispose()
    }
  mat.dispose()
}

// perf: cheap. Call once on teardown. Without this, GPU memory leaks across
// scene swaps.
