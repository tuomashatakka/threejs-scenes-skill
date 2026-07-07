// lib/jsx/components.ts
// Host config for the JSX reconciler. Each intrinsic element name maps to a
// Host: a real three object plus a setProp(name, value) applier and a dispose().
// The reconciler owns reactivity and tree-walking; this file owns the mapping
// from <Tag> to lib factories.

import * as THREE from 'three'

import { createIsoCamera } from '../camera/iso-camera.js'
import { createFollowCamera } from '../camera/follow-camera.js'
import { createInstancedProp } from '../props/instanced-prop.js'
import { resolveProp } from '../props/registry.js'
import { createComposer } from '../post/composer.js'
import type { ComposerHandle } from '../post/composer.js'
import type { FrameContext, InstancePlaceFn, PropFactory, PropInstance, SeededRng, FrameLoop } from '../types.js'


export interface ReactiveBinding {
  get:   () => unknown
  apply: (value: unknown) => void
}

export interface Runtime {
  scene:    THREE.Scene
  renderer: THREE.WebGLRenderer
  loop:     FrameLoop
  rng:      SeededRng
  getCamera (): THREE.Camera
  setCamera (camera: THREE.Camera, isDefault?: boolean): void
  getAspect (): number
  getSize (): [number, number]
  addReactive (binding: ReactiveBinding): void
  addDisposer (fn: () => void): void
  addPostSetup (fn: () => void): void
  setComposer (handle: ComposerHandle): void
  disableOrbit (): void
}

export interface Host {
  object:    THREE.Object3D | null
  container: THREE.Object3D | null
  setProp (name: string, value: unknown): void
  dispose (): void
}

function applyCommon (object: THREE.Object3D, name: string, value: unknown): boolean {
  switch (name) {
    case 'position': object.position.fromArray(value as number[]); return true
    case 'rotation': object.rotation.fromArray(value as [number, number, number]); return true
    case 'scale':
      if (typeof value === 'number')
        object.scale.setScalar(value)
      else
        object.scale.fromArray(value as number[])
      return true
    case 'visible': object.visible = Boolean(value); return true
    case 'name': object.name = String(value); return true
    case 'castShadow': object.castShadow = Boolean(value); return true
    case 'receiveShadow': object.receiveShadow = Boolean(value); return true
    case 'lookAt': object.lookAt(...(value as [number, number, number])); return true
    default: return false
  }
}

function createLight (type: string): THREE.Light {
  switch (type) {
    case 'ambient': return new THREE.AmbientLight()
    case 'hemisphere': return new THREE.HemisphereLight()
    case 'directional': return new THREE.DirectionalLight()
    case 'spot': return new THREE.SpotLight()
    case 'point':
    default: return new THREE.PointLight()
  }
}

function lightHost (props: Record<string, unknown>): Host {
  const light = createLight(String(props.type ?? 'point'))
  // ambient/hemisphere lights have no shadow camera — enabling castShadow on
  // them spams "<light> has no shadow" every frame.
  light.castShadow = 'shadow' in light
  return {
    object:    light,
    container: light,
    setProp (name, value) {
      const l = light as THREE.Light & {
        distance?: number; decay?: number; angle?: number; penumbra?: number; groundColor?: THREE.Color
      }
      switch (name) {
        case 'type': break
        case 'color': light.color.set(value as THREE.ColorRepresentation); break
        case 'intensity': light.intensity = value as number; break
        case 'distance': if (l.distance !== undefined)
          l.distance = value as number; break
        case 'decay': if (l.decay !== undefined)
          l.decay = value as number; break
        case 'angle': if (l.angle !== undefined)
          l.angle = value as number; break
        case 'penumbra': if (l.penumbra !== undefined)
          l.penumbra = value as number; break
        case 'groundColor': l.groundColor?.set(value as THREE.ColorRepresentation); break
        default: applyCommon(light, name, value)
      }
    },
    dispose () {
      light.parent?.remove(light)
      light.dispose()
    },
  }
}

function cameraHost (props: Record<string, unknown>, rt: Runtime): Host {
  const type = String(props.type ?? 'perspective')
  let camera: THREE.Camera

  if (type === 'iso')
    camera = createIsoCamera(rt.getAspect(), {
      viewSize: props.viewSize as number | undefined,
      flavor:   props.flavor as 'true-iso' | 'dimetric' | undefined,
    }); else
    camera = new THREE.PerspectiveCamera(
      (props.fov as number) ?? 50,
      rt.getAspect(),
      (props.near as number) ?? 0.1,
      (props.far as number) ?? 500,
    )

  rt.setCamera(camera, props.makeDefault !== false)

  if (type === 'follow' && props.target) {
    const offset     = new THREE.Vector3().fromArray((props.offset as number[]) ?? [ 0, 3, 6 ])
    const controller = createFollowCamera(camera, props.target as THREE.Object3D, { offset })
    rt.addDisposer(rt.loop.registerUpdate(ctx => controller.update(ctx)))
    rt.disableOrbit()
  }

  return {
    object:    camera,
    container: camera,
    setProp (name, value) {
      const cam = camera as THREE.PerspectiveCamera
      switch (name) {
        case 'type': case 'makeDefault': case 'target': case 'offset':
        case 'viewSize': case 'flavor':
          break
        case 'fov': if (cam.isPerspectiveCamera) {
          cam.fov = value as number; cam.updateProjectionMatrix()
        } break
        case 'near': cam.near = value as number; cam.updateProjectionMatrix(); break
        case 'far': cam.far = value as number; cam.updateProjectionMatrix(); break
        default: applyCommon(camera, name, value)
      }
    },
    dispose () {},
  }
}

function propHost (props: Record<string, unknown>, rt: Runtime): Host {
  const placeholder = new THREE.Group()
  let instance: PropInstance | null = null
  const src = props.src as PropFactory | string

  resolveProp(src, { rng: rt.rng, loop: rt.loop })
    .then(inst => {
      instance = inst
      placeholder.add(inst.object)
    })
    .catch((err: unknown) => console.error('<Prop> failed to load', src, err))

  return {
    object:    placeholder,
    container: placeholder,
    setProp (name, value) {
      if (name === 'src' || name === 'autoplay')
        return
      applyCommon(placeholder, name, value)
    },
    dispose () {
      instance?.dispose()
    },
  }
}

function instancesHost (props: Record<string, unknown>, rt: Runtime): Host {
  const group = new THREE.Group()
  let dispose = (): void => {}

  const options = {
    count:  (props.count as number) ?? 100,
    radius: props.radius as number | undefined,
    seed:   props.seed as number | undefined,
    place:  props.place as InstancePlaceFn | undefined,
  }

  const factory = props.factory as PropFactory | undefined
  if (factory) {
    const result = createInstancedProp(factory, options, { rng: rt.rng, loop: rt.loop })
    group.add(result.object)
    dispose = result.dispose
  }
  else if (typeof props.src === 'string')
    import(/* @vite-ignore */ props.src as string)
      .then(mod => {
        const f      = ((mod as Record<string, unknown>).default ?? (mod as Record<string, unknown>).prop) as PropFactory
        const result = createInstancedProp(f, options, { rng: rt.rng, loop: rt.loop })
        group.add(result.object)
        dispose = result.dispose
      })
      .catch((err: unknown) => console.error('<Instances> failed to load', props.src, err))

  return {
    object:    group,
    container: group,
    setProp (name, value) {
      if ([ 'count', 'radius', 'seed', 'place', 'factory', 'src' ].includes(name))
        return
      applyCommon(group, name, value)
    },
    dispose () {
      dispose()
    },
  }
}

function postHost (props: Record<string, unknown>, rt: Runtime): Host {
  let handle: ComposerHandle | null = null

  rt.addPostSetup(() => {
    const [ width, height ] = rt.getSize()
    handle = createComposer({
      renderer:       rt.renderer,
      scene:          rt.scene,
      camera:         rt.getCamera(),
      width,
      height,
      withBloom:      props.bloom !== false,
      bloomStrength:  props.bloomStrength as number | undefined,
      bloomRadius:    props.bloomRadius as number | undefined,
      bloomThreshold: props.bloomThreshold as number | undefined,
    })
    rt.setComposer(handle)
  })

  return {
    object:    null,
    container: null,
    setProp () {},
    dispose () {
      handle?.dispose()
    },
  }
}

export function createHost (type: string, props: Record<string, unknown>, rt: Runtime): Host {
  switch (type) {
    case 'scene':
      return {
        object:    rt.scene,
        container: rt.scene,
        setProp (name, value) {
          if (name === 'background')
            rt.scene.background = new THREE.Color(value as THREE.ColorRepresentation)
          else if (name === 'environment')
            rt.scene.environment = value as THREE.Texture
        },
        dispose () {},
      }
    case 'group': {
      const group = new THREE.Group()
      return { object: group, container: group, setProp: (n, v) => applyCommon(group, n, v), dispose () {} }
    }
    case 'mesh': {
      const mesh = new THREE.Mesh()
      return {
        object:    mesh,
        container: mesh,
        setProp (name, value) {
          if (name === 'geometry')
            mesh.geometry = value as THREE.BufferGeometry
          else if (name === 'material')
            mesh.material = value as THREE.Material
          else
            applyCommon(mesh, name, value)
        },
        dispose () {},
      }
    }
    case 'primitive': {
      const object = props.object as THREE.Object3D
      return {
        object,
        container: object,
        setProp (name, value) {
          if (name !== 'object')
            applyCommon(object, name, value)
        },
        dispose () {},
      }
    }
    case 'light': return lightHost(props)
    case 'camera': return cameraHost(props, rt)
    case 'prop': return propHost(props, rt)
    case 'instances': return instancesHost(props, rt)
    case 'post': return postHost(props, rt)
    default:
      throw new Error(`<${type}> is not a known intrinsic element`)
  }
}

export const RAW_FUNCTION_PROPS = new Set([ 'place', 'build', 'clips', 'lights' ])

// perf: host creation is one-off at mount. Lights default castShadow=true — turn
// it off (castShadow={false}) on fill lights to save shadow-map passes.
export type { FrameContext }
