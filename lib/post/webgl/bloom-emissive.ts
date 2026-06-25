// lib/post/webgl/bloom-emissive.ts
// Emissive bloom — like selective bloom, but objects are auto-enrolled by their
// material's emissive output instead of a manual layer. WebGL equivalent of the
// WebGPU `webgpu/bloom-emissive.ts` (which bloomed a dedicated emissive MRT
// channel). Here we mark every mesh whose material emits light, then reuse the
// two-composer selective-bloom machinery.

import * as THREE from 'three'

import { createSelectiveBloom, BLOOM_LAYER } from './bloom-selective.js'
import type { SelectiveBloomOptions, SelectiveBloomHandle } from './bloom-selective.js'
import type { WebGlPassContext } from './types.js'


export interface EmissiveBloomOptions extends SelectiveBloomOptions {
  // A material counts as emissive when its emissiveIntensity exceeds this and
  // its emissive colour is not black. Default 0.
  emissiveThreshold?: number
}

function isEmissive (material: THREE.Material, threshold: number): boolean {
  const m = material as THREE.MeshStandardMaterial
  return m.emissive !== undefined &&
    (m.emissiveIntensity ?? 0) > threshold &&
    m.emissive.r + m.emissive.g + m.emissive.b > 0
}

export function createEmissiveBloom (
  ctx: WebGlPassContext,
  options: EmissiveBloomOptions = {},
): SelectiveBloomHandle {
  const { emissiveThreshold = 0, ...bloomOptions } = options
  const handle                                     = createSelectiveBloom(ctx, bloomOptions)

  // Walk the scene and enrol every emissive mesh onto the bloom layer.
  ctx.scene.traverse(obj => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh)
      return

    const mats = Array.isArray(mesh.material) ? mesh.material : [ mesh.material ]
    if (mats.some(m => isEmissive(m, emissiveThreshold)))
      obj.layers.enable(BLOOM_LAYER)
  })

  return handle
}

// perf: medium-expensive. Inherits selective bloom's two-composer cost. Re-run
// the enrolment (markBloom) if you add emissive objects after construction.
