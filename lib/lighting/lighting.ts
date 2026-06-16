// lib/lighting/lighting.ts
// Standard scene lighting: IBL environment + sun + hemisphere fill. Tuned
// shadow frustum for typical mid-scale scenes. Ported from
// scripts/lighting-setup.js.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import type { Disposable } from '../types.js'


export interface EnvironmentOptions {
  intensity?: number
  envScene?:  THREE.Scene
}

export function applyEnvironment (
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  { intensity = 1, envScene }: EnvironmentOptions = {},
): THREE.Texture {
  const pmrem                = new THREE.PMREMGenerator(renderer)
  const env                  = envScene ?? new RoomEnvironment()
  const envTexture           = pmrem.fromScene(env, 0.04).texture
  scene.environment          = envTexture
  scene.environmentIntensity = intensity
  pmrem.dispose()
  if (!envScene)
    env.traverse(o => (o as THREE.Mesh).geometry?.dispose())
  return envTexture
}

export interface SunOptions {
  color?:         THREE.ColorRepresentation
  intensity?:     number
  position?:      THREE.Vector3
  shadowMapSize?: number
  shadowFrustum?: number
  shadowFar?:     number
}

export function createSun ({
  color = '#fff5e0',
  intensity = 3,
  position = new THREE.Vector3(8, 12, 6),
  shadowMapSize = 2048,
  shadowFrustum = 15,
  shadowFar = 30,
}: SunOptions = {}): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(color, intensity)
  sun.position.copy(position)
  sun.castShadow = true
  sun.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  sun.shadow.camera.near   = 1
  sun.shadow.camera.far    = shadowFar
  sun.shadow.camera.top    = shadowFrustum
  sun.shadow.camera.right  = shadowFrustum
  sun.shadow.camera.bottom = -shadowFrustum
  sun.shadow.camera.left   = -shadowFrustum
  sun.shadow.bias          = -0.0001
  sun.shadow.normalBias    = 0.02
  return sun
}

export interface HemisphereFillOptions {
  skyColor?:    THREE.ColorRepresentation
  groundColor?: THREE.ColorRepresentation
  intensity?:   number
}

export function createHemisphereFill ({
  skyColor = '#a0c0ff',
  groundColor = '#3a2a1a',
  intensity = 0.4,
}: HemisphereFillOptions = {}): THREE.HemisphereLight {
  return new THREE.HemisphereLight(skyColor, groundColor, intensity)
}

export interface StandardLightingOptions {
  env?:  EnvironmentOptions
  sun?:  SunOptions
  hemi?: HemisphereFillOptions
}

export interface StandardLighting extends Disposable {
  env:  THREE.Texture
  sun:  THREE.DirectionalLight
  hemi: THREE.HemisphereLight
}

export function setupStandardLighting (
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  options: StandardLightingOptions = {},
): StandardLighting {
  const env  = applyEnvironment(scene, renderer, options.env)
  const sun  = createSun(options.sun)
  const hemi = createHemisphereFill(options.hemi)
  scene.add(sun, sun.target, hemi)
  return {
    env,
    sun,
    hemi,
    dispose () {
      env.dispose()
      scene.remove(sun, sun.target, hemi)
    },
  }
}

// perf: medium. shadow render pass per sun per frame. Tune shadowMapSize down
// for mobile.
