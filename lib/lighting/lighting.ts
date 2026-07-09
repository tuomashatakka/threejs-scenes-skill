// lib/lighting/lighting.ts
// Standard scene lighting: IBL environment + sun + hemisphere fill. Tuned
// shadow frustum for typical mid-scale scenes. Ported from
// scripts/lighting-setup.js.

import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

import type { Disposable } from '../types.js'


/** Options for {@link applyEnvironment}: IBL `intensity` and an optional custom environment scene. */
export interface EnvironmentOptions {
  intensity?: number
  envScene?:  THREE.Scene
}

/**
 * Generate a PMREM environment map and assign it as `scene.environment` for
 * image-based lighting. Defaults to three's `RoomEnvironment`; pass
 * `envScene` for a custom look.
 *
 * @param scene - Scene receiving the environment.
 * @param renderer - Renderer used by the PMREM generator.
 * @param options - Intensity and optional custom environment scene.
 * @returns The environment texture — dispose it when done (the default
 * environment scene's geometry is freed immediately).
 */
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

/** Options for {@link createSun}: color, intensity, position, and shadow map/frustum sizing. */
export interface SunOptions {
  color?:         THREE.ColorRepresentation
  intensity?:     number
  position?:      THREE.Vector3
  shadowMapSize?: number
  shadowFrustum?: number
  shadowFar?:     number
}

/**
 * Warm shadow-casting `DirectionalLight` with a sensibly-sized orthographic
 * shadow frustum and a small negative shadow bias against acne.
 *
 * @param options - Color (default warm white), intensity (default 3),
 * position, and shadow tuning.
 * @returns The configured light; add both it and `light.target` to the scene.
 * @remarks Shadow cost scales with `shadowMapSize`² — gate it on the quality
 * tier (see `getQualitySettings`).
 */
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

/** Options for {@link createHemisphereFill}: sky/ground colors and intensity. */
export interface HemisphereFillOptions {
  skyColor?:    THREE.ColorRepresentation
  groundColor?: THREE.ColorRepresentation
  intensity?:   number
}

/** Soft ambient fill: a `HemisphereLight` blending sky and ground bounce colors (defaults: cool sky, warm earth, 0.4). */
export function createHemisphereFill ({
  skyColor = '#a0c0ff',
  groundColor = '#3a2a1a',
  intensity = 0.4,
}: HemisphereFillOptions = {}): THREE.HemisphereLight {
  return new THREE.HemisphereLight(skyColor, groundColor, intensity)
}

/** Options for {@link setupStandardLighting}, grouping the environment, sun, and hemisphere sub-options. */
export interface StandardLightingOptions {
  env?:  EnvironmentOptions
  sun?:  SunOptions
  hemi?: HemisphereFillOptions
}

/** The standard rig's parts. `dispose()` frees the env texture and removes the lights from the scene. */
export interface StandardLighting extends Disposable {
  env:  THREE.Texture
  sun:  THREE.DirectionalLight
  hemi: THREE.HemisphereLight
}

/**
 * The go-to three-part lighting rig: PMREM room environment for IBL, a warm
 * shadow-casting sun, and a hemisphere fill — added to the scene in one call.
 *
 * @param scene - Scene to light.
 * @param renderer - Renderer for PMREM generation.
 * @param options - Per-part overrides.
 * @returns A {@link StandardLighting} handle for tuning and teardown.
 * @example
 * const lights = setupStandardLighting(scene, renderer, { sun: { intensity: 2 } })
 */
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
