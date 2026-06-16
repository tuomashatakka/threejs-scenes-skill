// scripts/material-presets.js
// Common starting materials from the library's materials module — a sphere per
// PBR preset plus toon and matcap. '@tuomashatakka/threejs-scenes' maps to the
// local './lib/dist/' copy in an artifact (see references/library-local.md).

import * as THREE from 'three'

import {
  createStandardMaterial, createToonMaterial, createMatcapMaterial, layoutGrid,
} from '@tuomashatakka/threejs-scenes'


export function buildMaterialBalls (scene) {
  const sphere = new THREE.SphereGeometry(0.8, 48, 48)
  const materials = [
    createStandardMaterial('metal'),
    createStandardMaterial('gold'),
    createStandardMaterial('chrome'),
    createStandardMaterial('glass'),
    createStandardMaterial('plastic'),
    createStandardMaterial('rubber'),
    createStandardMaterial('matte'),
    createStandardMaterial('emissive'),
    createToonMaterial({ color: '#ff7ad9', steps: 4 }),
    createMatcapMaterial(),
  ]

  const balls = materials.map(m => new THREE.Mesh(sphere, m))
  layoutGrid(balls, { cols: 5, spacing: 2 })
  balls.forEach(b => scene.add(b))

  return { balls, dispose () { sphere.dispose(); materials.forEach(m => m.dispose()) } }
}

// perf: cheap. One shared geometry; one shader compile per unique material.
