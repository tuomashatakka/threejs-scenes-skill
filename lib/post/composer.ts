// lib/post/composer.ts
// EffectComposer factory. Wires up a DepthTexture so DOF / god rays / soft
// particles can sample scene depth. Canonical chain per production-lessons.md:
// RenderPass → UnrealBloomPass → ShaderPass(grade) → OutputPass. Tone-map
// exactly once, at OutputPass. Ported from scripts/composer-setup.js.

import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import type { Pass } from 'three/addons/postprocessing/Pass.js'

import type { Disposable } from '../types.js'




/** Options for {@link createComposer}: renderer, scene, camera, output dimensions, and optional bloom configuration. */
export interface ComposerOptions {
  renderer:        THREE.WebGLRenderer
  scene:           THREE.Scene
  camera:          THREE.Camera
  width:           number
  height:          number
  withDepth?:      boolean
  withBloom?:      boolean
  bloomStrength?:  number
  bloomRadius?:    number
  bloomThreshold?: number
}



/** Handle returned by {@link createComposer}, exposing the {@link EffectComposer}, the optional {@link UnrealBloomPass}, the {@link OutputPass}, and helper methods for resizing and inserting passes. */
export interface ComposerHandle extends Disposable {
  composer: EffectComposer
  bloom:    UnrealBloomPass | null
  output:   OutputPass
  setSize (w: number, h: number): void
  addPassBeforeOutput (pass: Pass): void
}



/**
 * Build an {@link EffectComposer} wired with a {@link RenderPass} and an {@link OutputPass}, optionally creating a shared {@link DepthTexture} and an {@link UnrealBloomPass}.
 *
 * @param options - Renderer, scene, camera, viewport size, and optional bloom/depth flags.
 * @param options.renderer - The WebGL2 renderer that owns the composer render targets.
 * @param options.scene - Scene to render each frame.
 * @param options.camera - Active camera.
 * @param options.width - Viewport width in pixels.
 * @param options.height - Viewport height in pixels.
 * @param options.withDepth - Attach a DepthTexture to both render targets for depth-sampling passes (DOF, god rays). @defaultValue true
 * @param options.withBloom - Insert an {@link UnrealBloomPass} after the RenderPass. @defaultValue true
 * @param options.bloomStrength - Bloom intensity. @defaultValue 0.7
 * @param options.bloomRadius - Bloom spread. @defaultValue 0.4
 * @param options.bloomThreshold - Luminance threshold for blooming. @defaultValue 0.85
 * @returns A {@link ComposerHandle} with the built chain — the canonical order is RenderPass, UnrealBloomPass, custom passes, OutputPass.
 * @remarks The chain runs in linear HDR; tone-mapping happens exactly once in OutputPass. Use addPassBeforeOutput to insert custom ShaderPass instances before tone-mapping.
 */
export function createComposer ({
  renderer,
  scene,
  camera,
  width,
  height,
  withDepth = true,
  withBloom = true,
  bloomStrength = 0.7,
  bloomRadius = 0.4,
  bloomThreshold = 0.85,
}: ComposerOptions): ComposerHandle {
  const composer = new EffectComposer(renderer)
  composer.setSize(width, height)

  if (withDepth) {
    const depthTexture                  = new THREE.DepthTexture(width, height)
    depthTexture.format                 = THREE.DepthFormat
    depthTexture.type                   = THREE.UnsignedIntType
    composer.renderTarget1.depthTexture = depthTexture
    composer.renderTarget2.depthTexture = depthTexture
  }

  composer.addPass(new RenderPass(scene, camera))

  let bloom: UnrealBloomPass | null = null
  if (withBloom) {
    bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomStrength, bloomRadius, bloomThreshold,
    )
    composer.addPass(bloom)
  }

  const output = new OutputPass()
  composer.addPass(output)

  function setSize (w: number, h: number): void {
    composer.setSize(w, h)
    if (bloom)
      bloom.setSize(w, h)

    const depth = composer.renderTarget1.depthTexture
    if (depth) {
      depth.image.width  = w
      depth.image.height = h
    }
  }

  function dispose (): void {
    composer.dispose()
  }

  function addPassBeforeOutput (pass: Pass): void {
    const outputIndex = composer.passes.indexOf(output)
    composer.passes.splice(outputIndex, 0, pass)
  }

  return { composer, bloom, output, setSize, dispose, addPassBeforeOutput }
}

// perf: medium. Each pass = one fullscreen fragment shader. Gate behind tier.
