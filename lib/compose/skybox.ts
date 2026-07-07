// lib/compose/skybox.ts
// Skybox factory: flat color, procedural vertical gradient (a BackSide shader
// dome — texture-free, works headless), equirect panorama, or six-face cube.
// Texture-loading paths are DOM-guarded; the gradient/color paths are pure GL
// objects and safe anywhere.

import * as THREE from 'three'

import type { Disposable } from '../types.js'


export interface GradientSkyOptions {
  top:    THREE.ColorRepresentation
  bottom: THREE.ColorRepresentation

  /** Curve of the blend: 1 = linear, >1 pushes the horizon color up. Default 1.5. */
  exponent?: number
}

export interface SkyboxOptions {

  /** Flat background color. */
  color?: THREE.ColorRepresentation

  /** Procedural vertical-gradient dome. */
  gradient?: GradientSkyOptions

  /** Equirectangular panorama — a texture, or a URL (DOM only). */
  equirect?: THREE.Texture | string

  /** Cube map — a CubeTexture, or six face URLs +x,-x,+y,-y,+z,-z (DOM only). */
  cube?: THREE.CubeTexture | string[]

  /** Also assign the texture as scene.environment for IBL. Default false. */
  environment?: boolean

  /** Gradient dome radius. Keep inside the camera far plane. Default 400. */
  radius?: number
}

export interface Skybox extends Disposable {

  /** The gradient dome mesh, when the gradient mode is active. */
  object: THREE.Object3D | null
}

const GRADIENT_VERTEX = /* glsl */ `
varying vec3 vDir;
void main () {
  vDir = normalize(position);
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  gl_Position = clip.xyww; // depth = far plane: the dome never occludes anything
}
`

const GRADIENT_FRAGMENT = /* glsl */ `
uniform vec3 uTop;
uniform vec3 uBottom;
uniform float uExponent;
varying vec3 vDir;
void main () {
  float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
  gl_FragColor = vec4(mix(uBottom, uTop, pow(h, uExponent)), 1.0);
}
`

export function createSkybox (scene: THREE.Scene, {
  color,
  gradient,
  equirect,
  cube,
  environment = false,
  radius = 400,
}: SkyboxOptions): Skybox {
  const previousBackground            = scene.background
  const previousEnvironment           = scene.environment
  const owned: { dispose (): void }[] = []
  let object: THREE.Object3D | null   = null

  function setTexture (texture: THREE.Texture, ownsTexture: boolean): void {
    scene.background = texture
    if (environment)
      scene.environment = texture
    if (ownsTexture)
      owned.push(texture)
  }

  if (gradient) {
    const material = new THREE.ShaderMaterial({
      vertexShader:   GRADIENT_VERTEX,
      fragmentShader: GRADIENT_FRAGMENT,
      uniforms:       {
        uTop:      { value: new THREE.Color(gradient.top) },
        uBottom:   { value: new THREE.Color(gradient.bottom) },
        uExponent: { value: gradient.exponent ?? 1.5 },
      },
      side:       THREE.BackSide,
      depthWrite: false,
      fog:        false,
    })
    const geometry     = new THREE.SphereGeometry(radius, 32, 16)
    const dome         = new THREE.Mesh(geometry, material)
    dome.frustumCulled = false
    dome.renderOrder   = -1
    object              = dome
    scene.add(dome)
    owned.push(geometry, material)
  }
  else if (color !== undefined)
    scene.background = new THREE.Color(color)
  else if (equirect)
    if (typeof equirect === 'string')
      if (typeof document === 'undefined')
        console.warn('createSkybox: equirect URL needs a DOM; skipped')
      else
        new THREE.TextureLoader().load(equirect, texture => {
          texture.mapping    = THREE.EquirectangularReflectionMapping
          texture.colorSpace = THREE.SRGBColorSpace
          setTexture(texture, true)
        })
    else {
      equirect.mapping = THREE.EquirectangularReflectionMapping
      setTexture(equirect, false)
    }
  else if (cube)
    if (Array.isArray(cube))
      if (typeof document === 'undefined')
        console.warn('createSkybox: cube URLs need a DOM; skipped')
      else
        new THREE.CubeTextureLoader().load(cube, texture => {
          texture.colorSpace = THREE.SRGBColorSpace
          setTexture(texture, true)
        })
    else
      setTexture(cube, false)

  return {
    object,
    dispose () {
      if (object)
        scene.remove(object)
      for (const resource of owned)
        resource.dispose()
      scene.background = previousBackground
      if (environment)
        scene.environment = previousEnvironment
    },
  }
}

// perf: cheap. gradient mode is one BackSide dome draw at far-plane depth;
// texture modes are zero extra draws (scene.background).
