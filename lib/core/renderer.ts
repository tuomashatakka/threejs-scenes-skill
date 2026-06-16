// lib/core/renderer.ts
// WebGLRenderer factory. Caps pixel ratio at 2, sets sane defaults for color
// space, tone mapping, and shadows. Ported from scripts/renderer-setup.js.

import * as THREE from 'three'


export interface RendererOptions {
  canvas:               HTMLCanvasElement
  antialias?:           boolean
  pixelRatioMax?:       number
  shadows?:             boolean
  toneMapping?:         THREE.ToneMapping
  toneMappingExposure?: number
}

export function createRenderer ({
  canvas,
  antialias = true,
  pixelRatioMax = 2,
  shadows = true,
  toneMapping = THREE.ACESFilmicToneMapping,
  toneMappingExposure = 1,
}: RendererOptions): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha:           false,
    powerPreference: 'high-performance',
    stencil:         false,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioMax))

  const parent = canvas.parentElement ?? document.body
  renderer.setSize(parent.clientWidth, parent.clientHeight, false)

  renderer.outputColorSpace    = THREE.SRGBColorSpace
  renderer.toneMapping         = toneMapping
  renderer.toneMappingExposure = toneMappingExposure

  if (shadows) {
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type    = THREE.PCFSoftShadowMap
  }

  return renderer
}

export type ResizeHandler = (width: number, height: number) => void

export function attachResizeObserver (
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
  onResize?: ResizeHandler,
): () => void {
  const ro = new ResizeObserver(entries => {
    const entry = entries[0]
    if (!entry)
      return

    const { width, height } = entry.contentRect
    renderer.setSize(width, height, false)
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const perspective  = camera as THREE.PerspectiveCamera
      perspective.aspect = width / height
      perspective.updateProjectionMatrix()
    }
    onResize?.(width, height)
  })
  ro.observe(canvas.parentElement ?? document.body)
  return () => ro.disconnect()
}

// perf: cheap. one renderer instance per scene, never recreated.
