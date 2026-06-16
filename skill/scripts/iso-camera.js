// scripts/iso-camera.js
// Isometric camera factory. 'true-iso' uses 35.264° tilt (atan(1/√2));
// 'dimetric' uses 30° (game-style, more readable).

import * as THREE from 'three'

export function createIsoCamera (aspect, {
  viewSize = 20,
  flavor = 'dimetric',
  near = 0.1,
  far = 500,
} = {}) {
  const h = viewSize / 2
  const w = h * aspect
  const camera = new THREE.OrthographicCamera(-w, w, h, -h, near, far)

  const tilt = flavor === 'true-iso'
    ? Math.atan(1 / Math.SQRT2)
    : THREE.MathUtils.degToRad(30)
  const radius = 100
  camera.position.set(
    Math.cos(THREE.MathUtils.degToRad(45)) * radius * Math.cos(tilt),
    Math.sin(tilt) * radius,
    Math.sin(THREE.MathUtils.degToRad(45)) * radius * Math.cos(tilt),
  )
  camera.lookAt(0, 0, 0)
  camera.userData.viewSize = viewSize
  camera.userData.flavor = flavor
  return camera
}

export function resizeIsoCamera (camera, aspect) {
  const h = camera.userData.viewSize / 2
  const w = h * aspect
  camera.left = -w; camera.right = w
  camera.top  =  h; camera.bottom = -h
  camera.updateProjectionMatrix()
}

// perf: cheap. one camera, zero per-frame work.
