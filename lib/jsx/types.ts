// lib/jsx/types.ts
// JSX typing. Declares the global JSX namespace so `.tsx` authored against this
// runtime gets autocomplete + checking on the intrinsic elements. Every spatial
// prop accepts a plain value OR an accessor (() => value) — the reactive form
// the reconciler re-reads each frame.

import type * as THREE from 'three'
import type { InstancePlaceFn, PropFactory } from '../types.js'
import type { SceneElement } from './jsx-runtime.js'


/** An `[x, y, z]` tuple. */
type Vec3 = [number, number, number]

/** A plain value, or an accessor the render loop re-reads and re-applies every frame. */
type Reactive<T> = T | (() => T)

/**
 * Transform and visibility props shared by every spatial intrinsic element.
 *
 * @remarks
 * Passing an accessor (`() => value`) to any `Reactive` field makes it live:
 * the render loop re-reads it every frame and mutates the mounted object in
 * place. Plain values are applied once at mount.
 */
interface CommonProps {

  /** Position as `[x, y, z]`. */
  position?: Reactive<Vec3>

  /** Euler rotation in radians as `[x, y, z]`. */
  rotation?: Reactive<Vec3>

  /** Uniform scale (number) or per-axis `[x, y, z]`. */
  scale?: Reactive<number | Vec3>

  /** Toggle rendering of this object and its children. */
  visible?: Reactive<boolean>

  /** Orient the object toward a world position. */
  lookAt?: Reactive<Vec3>

  /** `Object3D.name`, for lookups and debugging. */
  name?: string

  /** Cast shadows from shadow-enabled lights. */
  castShadow?: boolean

  /** Receive shadows cast by other objects. */
  receiveShadow?: boolean

  /** Nested elements, mounted under this object. */
  children?: unknown
}

/** Props for `<scene>`, the root intrinsic element. */
export interface SceneProps {

  /** Background color, applied at mount. */
  background?: THREE.ColorRepresentation

  /** Environment map used for image-based lighting. */
  environment?: THREE.Texture

  /** Scene contents. */
  children?: unknown
}

/** Props for `<mesh>` — a `THREE.Mesh` wrapping caller-supplied geometry and material. */
export interface MeshProps extends CommonProps {

  /** Geometry to render. */
  geometry?: THREE.BufferGeometry

  /** Material to render with. */
  material?: THREE.Material
}

/** Props for `<primitive>` — mounts an existing `THREE.Object3D` into the tree as-is (not cloned). */
export interface PrimitiveProps extends CommonProps {

  /** The pre-built object to insert. */
  object: THREE.Object3D
}

/**
 * Props for `<light>`. Shadow casting defaults to on for shadow-capable
 * types; per-type fields are ignored by lights that lack them.
 */
export interface LightProps extends CommonProps {

  /** Light kind (default `'point'`). */
  type?: 'spot' | 'point' | 'directional' | 'ambient' | 'hemisphere'

  /** Light color. */
  color?: Reactive<THREE.ColorRepresentation>

  /** Light intensity. */
  intensity?: Reactive<number>

  /** Maximum range (point/spot). */
  distance?: number

  /** Falloff along `distance` (point/spot). */
  decay?: number

  /** Cone angle in radians (spot). */
  angle?: number

  /** Soft-edge fraction, 0–1 (spot). */
  penumbra?: number

  /** Ground color (hemisphere). */
  groundColor?: THREE.ColorRepresentation
}

/**
 * Props for `<camera>`. Mounting one replaces the built-in default camera;
 * `type='follow'` tracks `target` every frame and disables orbit gestures.
 */
export interface CameraProps extends CommonProps {

  /** Camera kind: `'perspective'` (default), orthographic `'iso'`, or `'follow'`. */
  type?: 'perspective' | 'iso' | 'follow'

  /** Vertical field of view in degrees (perspective, default `50`). */
  fov?: number

  /** Near clipping plane (default `0.1`). */
  near?: number

  /** Far clipping plane (default `500`). */
  far?: number

  /** Become the active camera (default `true`). */
  makeDefault?: boolean

  /** Object a `'follow'` camera tracks. */
  target?: THREE.Object3D

  /** Follow offset from `target` (default `[0, 3, 6]`). */
  offset?: Vec3

  /** Orthographic view size (`'iso'` only). */
  viewSize?: number

  /** Iso projection flavor. */
  flavor?: 'true-iso' | 'dimetric'
}

/**
 * Props for `<prop>`. Resolves `src` asynchronously and parents the result
 * under a placeholder group, so the element itself mounts immediately.
 */
export interface PropProps extends CommonProps {

  /** A `PropFactory`, a registered prop name, a `.glb`/`.gltf` URL, or a module path with a prop export. */
  src: PropFactory | string

  /** Auto-play the prop's animation clips (default `true`). */
  autoplay?: boolean
}

/**
 * Props for `<instances>`. Renders `count` copies of one prop through
 * instancing, collapsing them into a handful of draw calls.
 */
export interface InstancesProps extends CommonProps {

  /** Prop factory to instance (takes precedence over `src`). */
  factory?: PropFactory

  /** Module path whose `default` (or `prop`) export is the factory, imported dynamically. */
  src?: string

  /** Number of instances (default `100`). */
  count?: number

  /** Scatter radius for the default placement. */
  radius?: number

  /** Seed for deterministic placement. */
  seed?: number

  /** Per-instance placement callback: position instance `index` by mutating the proxy object (and optionally its color). */
  place?: InstancePlaceFn
}

/**
 * Props for `<post>`. Builds an `EffectComposer` once the tree has mounted;
 * the frame loop then renders through it instead of the raw renderer.
 */
export interface PostProps {

  /** Include the bloom pass (default `true`). */
  bloom?: boolean

  /** Bloom strength. */
  bloomStrength?: number

  /** Bloom radius. */
  bloomRadius?: number

  /** Luminance threshold above which pixels bloom. */
  bloomThreshold?: number

  /** Mounted into the surrounding container — `<post>` adds no object of its own. */
  children?: unknown
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- JSX typing requires the global JSX namespace
  namespace JSX {
    type Element = SceneElement
    interface ElementChildrenAttribute { children: object }
    interface IntrinsicElements {
      scene:     SceneProps
      group:     CommonProps
      mesh:      MeshProps
      primitive: PrimitiveProps
      light:     LightProps
      camera:    CameraProps
      prop:      PropProps
      instances: InstancesProps
      post:      PostProps
    }
  }
}
