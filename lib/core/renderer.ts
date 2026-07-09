// lib/core/renderer.ts
// WebGLRenderer factory. Caps pixel ratio at 2, sets sane defaults for color
// space, tone mapping, and shadows. Ported from scripts/renderer-setup.js.

import * as THREE from 'three'


/** Options for {@link createRenderer}. */
export interface RendererOptions {
  canvas:               HTMLCanvasElement

  /** @defaultValue true */
  antialias?:           boolean

  /**
   * Upper bound applied to `window.devicePixelRatio`.
   * @defaultValue 2
   */
  pixelRatioMax?:       number

  /**
   * Enable PCF soft shadow maps.
   * @defaultValue true
   */
  shadows?:             boolean

  /** @defaultValue THREE.ACESFilmicToneMapping */
  toneMapping?:         THREE.ToneMapping

  /** @defaultValue 1 */
  toneMappingExposure?: number

  /** For scenes spanning huge depth ranges (space scale -> surface scale). */
  logarithmicDepthBuffer?: boolean
}

/**
 * Create a `WebGLRenderer` with production defaults: high-performance power
 * preference, sRGB output, ACES filmic tone mapping, PCF soft shadows, and
 * pixel ratio capped at 2. The renderer is sized to the canvas parent element
 * (falling back to `document.body`) without touching the canvas CSS size.
 *
 * @param options - Canvas plus overrides; see {@link RendererOptions}.
 * @returns The configured renderer. Create one per scene and never recreate it
 * per frame; call `dispose()` on teardown.
 */
export function createRenderer ({
  canvas,
  antialias = true,
  pixelRatioMax = 2,
  shadows = true,
  toneMapping = THREE.ACESFilmicToneMapping,
  toneMappingExposure = 1,
  logarithmicDepthBuffer = false,
}: RendererOptions): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias,
    alpha:           false,
    powerPreference: 'high-performance',
    stencil:         false,
    logarithmicDepthBuffer,
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

/** Callback invoked after a resize with the new width and height in CSS pixels. */
export type ResizeHandler = (width: number, height: number) => void

/**
 * Keep the renderer and camera in sync with the canvas parent's size via a
 * `ResizeObserver`. On each resize the renderer is resized and, for
 * perspective cameras, the aspect ratio and projection matrix are updated;
 * `onResize` then runs for app-level work (ortho frustums, composers).
 *
 * @returns Detach function that disconnects the observer.
 */
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
