// lib/materials/shader-quad.ts
// Full-screen fragment-shader runner, ported from webgl-journey-hell's
// createShaderQuad (raw WebGL) to three.js. One fullscreen triangle + a
// ShaderMaterial with the standard uniform contract: iResolution (px),
// iTime (s), uPointer (-1..1, +y up). Use it for shadertoy-style raymarch
// scenes, animated backdrops, or as a base layer under a 3D scene.

import * as THREE from 'three'

import type { Disposable, FrameContext } from '../types.js'


export interface ShaderQuadOptions {

  /** Fragment shader. Receives iResolution, iTime, uPointer + your uniforms. */
  fragmentShader: string

  /** Extra uniforms merged into the standard set. */
  uniforms?: Record<string, THREE.IUniform>

  /** Track pointer position on this element into uPointer. */
  pointerElement?: HTMLElement
}

export interface ShaderQuad extends Disposable {
  scene:    THREE.Scene
  camera:   THREE.OrthographicCamera
  material: THREE.ShaderMaterial

  /** Advance iTime and (if sizeable) iResolution. Call once per frame. */
  update (ctx: FrameContext, renderer: THREE.WebGLRenderer): void

  /** update + renderer.render in one call, for shader-only scenes. */
  render (ctx: FrameContext, renderer: THREE.WebGLRenderer): void
}

const VERTEX = /* glsl */`
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

export function createShaderQuad ({ fragmentShader, uniforms = {}, pointerElement }: ShaderQuadOptions): ShaderQuad {
  const material = new THREE.ShaderMaterial({
    depthTest:  false,
    depthWrite: false,
    uniforms:   {
      iResolution: { value: new THREE.Vector2(1, 1) },
      iTime:       { value: 0 },
      uPointer:    { value: new THREE.Vector2(0, 0) },
      ...uniforms,
    },
    vertexShader: VERTEX,
    fragmentShader,
  })

  // one triangle covering clip space — no diagonal seam, fewer helper invocations
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([ -1, -1, 0, 3, -1, 0, -1, 3, 0 ], 3))

  const mesh         = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false

  const scene  = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  scene.add(mesh)

  let detach = (): void => {}
  if (pointerElement) {
    const onMove = (e: PointerEvent): void => {
      const rect = pointerElement.getBoundingClientRect()
      material.uniforms.uPointer.value.set(
        (e.clientX - rect.left) / rect.width * 2 - 1,
        -((e.clientY - rect.top) / rect.height * 2 - 1),
      )
    }
    pointerElement.addEventListener('pointermove', onMove)
    detach = () => pointerElement.removeEventListener('pointermove', onMove)
  }

  const size = new THREE.Vector2()

  function update ({ elapsed }: FrameContext, renderer: THREE.WebGLRenderer): void {
    material.uniforms.iTime.value = elapsed
    renderer.getSize(size)
    material.uniforms.iResolution.value.set(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio())
  }

  return {
    scene,
    camera,
    material,
    update,
    render (ctx, renderer) {
      update(ctx, renderer)
      renderer.render(scene, camera)
    },
    dispose () {
      detach()
      geometry.dispose()
      material.dispose()
    },
  }
}

// perf: fragment-bound. Cost = shader complexity × pixels; cap DPR (the
// renderer factory already clamps to 2) and prefer half-res render targets for
// heavy raymarchers composited under UI.
