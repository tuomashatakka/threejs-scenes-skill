// lib/lighting/presets.ts
// Named cinematic lighting rigs, ported from anime-anima's VRMViewer. One
// declarative LightingConfig record per preset (background, exposure, fog,
// hemi/key/rim/accent/spot); createLightingRig builds the lights once and
// setPreset() retunes them — no allocation on switch. Beams pair with
// createLightCone (light-cone.ts) for visible volumetric shafts.

import * as THREE from 'three'

import { createLightCone } from './light-cone.js'
import type { Disposable } from '../types.js'


export type LightingPresetName = 'dramatic' | 'studio' | 'soft' | 'neon' | 'sunset'

export interface LightingConfig {
  background: number
  exposure:   number
  fog:        [number, number]
  hemi:       [number, number, number] // sky, ground, intensity
  key:        [number, number, [number, number, number]] // colour, intensity, position
  rim:        [number, number, [number, number, number]]
  accent:     [number, number, [number, number, number]]

  /** Optional narrow theatrical spotlight: colour, intensity, position, cone angle (rad). */
  spot?: [number, number, [number, number, number], number]

  /** Optional pair of visible cone-shaped beams converging on the origin: colour, intensity. */
  beams?: [number, number]
}

export const LIGHTING_PRESETS: Record<LightingPresetName, LightingConfig> = {
  // Mostly black, with two crossing volumetric beams pooling on the stage.
  dramatic: {
    background: 0x040507,
    exposure:   1.18,
    fog:        [ 9, 30 ],
    hemi:       [ 0x222d40, 0x040507, 0.16 ],
    key:        [ 0xfff0d8, 0.7, [ 5, 9, 5 ]],
    rim:        [ 0x3a5cff, 1.4, [ -6, 5, -6 ]],
    accent:     [ 0xffffff, 0, [ -5, 4, 4 ]],
    beams:      [ 0xfff1de, 160 ],
  },
  studio: {
    background: 0x0b0e16,
    exposure:   1.18,
    fog:        [ 8, 30 ],
    hemi:       [ 0x6f7ea8, 0x10131c, 0.62 ],
    key:        [ 0xffe6c4, 3.1, [ 5, 8, 4 ]],
    rim:        [ 0x4f7bff, 2.7, [ -6, 5, -6 ]],
    accent:     [ 0xff2e7e, 38, [ -5, 4, 4 ]],
    spot:       [ 0xfff2dc, 65, [ 1.6, 6.5, 2.6 ], Math.PI / 13 ],
  },
  soft: {
    background: 0x262b35,
    exposure:   1.22,
    fog:        [ 12, 36 ],
    hemi:       [ 0xc8d2ec, 0x4a505e, 1.15 ],
    key:        [ 0xfff4e8, 2.7, [ 4, 7, 5 ]],
    rim:        [ 0xbfd0ff, 1.2, [ -4, 4, -5 ]],
    accent:     [ 0xffffff, 0, [ -5, 4, 4 ]],
  },
  neon: {
    background: 0x0a0814,
    exposure:   1.38,
    fog:        [ 6, 24 ],
    hemi:       [ 0x303060, 0x0a0814, 0.45 ],
    key:        [ 0x00e5ff, 2.8, [ 5, 6, 4 ]],
    rim:        [ 0xff00aa, 3.1, [ -6, 5, -5 ]],
    accent:     [ 0x9b5cff, 54, [ -4, 4, 5 ]],
    spot:       [ 0x00e5ff, 105, [ -1.8, 6.5, 2.2 ], Math.PI / 16 ],
  },
  sunset: {
    background: 0x1d1018,
    exposure:   1.4,
    fog:        [ 9, 32 ],
    hemi:       [ 0x8a647e, 0x241016, 0.82 ],
    key:        [ 0xffb066, 3.8, [ 6, 5, 3 ]],
    rim:        [ 0xff5e8a, 2.2, [ -5, 4, -6 ]],
    accent:     [ 0x4060ff, 19, [ -5, 5, 5 ]],
    spot:       [ 0xffcaa0, 75, [ 2.2, 6, 2.4 ], Math.PI / 13 ],
  },
}

export interface LightingRigOptions {

  /** Initial preset. Default: 'studio'. */
  preset?: LightingPresetName

  /** Cast shadows from the key light. Default: true. */
  shadows?: boolean

  /** Extra presets merged over the built-ins. */
  presets?: Record<string, LightingConfig>
}

export interface LightingRig extends Disposable {
  hemi:   THREE.HemisphereLight
  key:    THREE.DirectionalLight
  rim:    THREE.DirectionalLight
  accent: THREE.PointLight
  spot:   THREE.SpotLight
  cones:  THREE.Mesh[]

  /** Retune every light (and scene bg/fog/exposure) to a named preset. */
  setPreset (name: LightingPresetName | string): void
}

export function createLightingRig (
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  { preset = 'studio', shadows = true, presets = {}}: LightingRigOptions = {},
): LightingRig {
  const configs: Record<string, LightingConfig> = { ...LIGHTING_PRESETS, ...presets }

  const hemi   = new THREE.HemisphereLight(0xffffff, 0x000000, 1)
  const key    = new THREE.DirectionalLight(0xffffff, 1)
  const rim    = new THREE.DirectionalLight(0xffffff, 1)
  const accent = new THREE.PointLight(0xffffff, 0, 30, 2)
  const spot   = new THREE.SpotLight(0xffffff, 0, 40, Math.PI / 13, 0.4, 1.4)

  if (shadows) {
    key.castShadow           = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far  = 40
    key.shadow.bias        = -0.0004
  }
  spot.target.position.set(0, 0, 0)
  scene.add(hemi, key, rim, accent, spot, spot.target)

  if (!scene.fog)
    scene.fog = new THREE.Fog(0x000000, 10, 30)
  if (!(scene.background instanceof THREE.Color))
    scene.background = new THREE.Color(0x000000)

  // Two crossing beams converging on the origin, shown only when the preset asks.
  const cones = [
    createLightCone(new THREE.Vector3(5, 9, 5), new THREE.Vector3(0, 0, 0)),
    createLightCone(new THREE.Vector3(-6, 8, -4), new THREE.Vector3(0, 0, 0)),
  ]
  for (const cone of cones) {
    cone.visible = false
    scene.add(cone)
  }

  function setPreset (name: string): void {
    const c = configs[name]
    if (!c)
      throw new Error(`createLightingRig: unknown preset "${name}"`);
    (scene.background as THREE.Color).set(c.background)

    const fog = scene.fog as THREE.Fog
    fog.color.set(c.background)
    fog.near                     = c.fog[0]
    fog.far                      = c.fog[1]
    renderer.toneMappingExposure = c.exposure

    hemi.color.set(c.hemi[0])
    hemi.groundColor.set(c.hemi[1])
    hemi.intensity = c.hemi[2]

    key.color.set(c.key[0])
    key.intensity = c.key[1]
    key.position.set(...c.key[2])
    rim.color.set(c.rim[0])
    rim.intensity = c.rim[1]
    rim.position.set(...c.rim[2])
    accent.color.set(c.accent[0])
    accent.intensity = c.accent[1]
    accent.position.set(...c.accent[2])

    if (c.spot) {
      spot.color.set(c.spot[0])
      spot.intensity = c.spot[1]
      spot.position.set(...c.spot[2])
      spot.angle = c.spot[3]
    }
    else
      spot.intensity = 0

    for (const cone of cones) {
      cone.visible = Boolean(c.beams)
      if (c.beams) {
        const material = cone.material as THREE.ShaderMaterial
        material.uniforms.uColor.value.set(c.beams[0])
      }
    }
  }

  setPreset(preset)

  return {
    hemi,
    key,
    rim,
    accent,
    spot,
    cones,
    setPreset,
    dispose () {
      scene.remove(hemi, key, rim, accent, spot, spot.target)
      for (const cone of cones) {
        scene.remove(cone)
        cone.geometry.dispose();
        (cone.material as THREE.Material).dispose()
      }
      key.shadow.map?.dispose()
    },
  }
}

// perf: cheap. Switching presets writes uniforms/properties only — the lights,
// cones and shadow map are allocated once.
