// scripts/composer-setup.js
// EffectComposer factory. Wires up a DepthTexture so DOF / god rays / soft
// particles can sample scene depth.

import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'

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
} = {}) {
  const composer = new EffectComposer(renderer)
  composer.setSize(width, height)

  if (withDepth) {
    const depthTexture = new THREE.DepthTexture(width, height)
    depthTexture.format = THREE.DepthFormat
    depthTexture.type = THREE.UnsignedIntType
    composer.renderTarget1.depthTexture = depthTexture
    composer.renderTarget2.depthTexture = depthTexture
  }

  composer.addPass(new RenderPass(scene, camera))

  let bloom = null
  if (withBloom) {
    bloom = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      bloomStrength, bloomRadius, bloomThreshold,
    )
    composer.addPass(bloom)
  }

  const output = new OutputPass()
  composer.addPass(output)

  function setSize (w, h) {
    composer.setSize(w, h)
    if (bloom) bloom.setSize(w, h)
    if (composer.renderTarget1.depthTexture) {
      composer.renderTarget1.depthTexture.image = { width: w, height: h }
    }
  }

  function dispose () {
    composer.dispose()
  }

  return {
    composer,
    bloom,
    output,
    setSize,
    dispose,
    addPassBeforeOutput (pass) {
      const outputIndex = composer.passes.indexOf(output)
      composer.passes.splice(outputIndex, 0, pass)
    },
  }
}

// perf: medium. Each pass = one fullscreen fragment shader. Gate behind tier.
