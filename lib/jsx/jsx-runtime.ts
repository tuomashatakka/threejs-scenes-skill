// lib/jsx/jsx-runtime.ts
// JSX runtime. `jsx`/`jsxs` are what a `react-jsx`-style transpile calls;
// `h` is the hyperscript form so you can build the same trees WITHOUT a build
// step (handy for CDN/artifact usage). Both produce plain SceneElement
// descriptors — no work happens until render() walks the tree.

/**
 * A function component: receives props (including `children`) and returns
 * element descriptors to mount in its place.
 *
 * @remarks
 * Invoked exactly once, while the tree mounts — never re-rendered. Ongoing
 * change flows through accessor-valued props and hooks, not re-invocation.
 */
export type ComponentFn = (props: Record<string, unknown>) => SceneElement | SceneElement[] | null
/** What a JSX tag resolves to: an intrinsic name, a `ComponentFn`, or `Fragment`. */
export type ElementType = string | ComponentFn | typeof Fragment

/**
 * Inert element descriptor produced by `jsx`/`h`. Plain data — no three.js
 * objects exist until `render()` mounts the tree.
 */
export interface SceneElement {
  /** Intrinsic tag name, function component, or `Fragment`. */
  type:     ElementType
  /** All props except `children`. */
  props:    Record<string, unknown>
  /** Normalized child list. */
  children: SceneChild[]
}

/**
 * Anything acceptable as a JSX child. Elements and nested arrays are mounted;
 * `null`, `undefined`, booleans, strings and numbers are skipped — a 3D scene
 * has no text nodes.
 */
export type SceneChild = SceneElement | string | number | boolean | null | undefined | SceneChild[]

/** Fragment tag: mounts its children into the parent without adding an object of its own. */
export const Fragment = Symbol('jsx.Fragment')

function normalizeChildren (children: unknown): SceneChild[] {
  if (children === undefined || children === null)
    return []
  return (Array.isArray(children) ? children : [ children ]) as SceneChild[]
}

/**
 * Create a `SceneElement` descriptor; the entry point a `react-jsx` transform
 * compiles JSX tags into.
 *
 * @remarks
 * Pure and inert — no three.js objects are created and no work happens until
 * `render()` walks the tree.
 *
 * @param type - Intrinsic tag name, function component, or `Fragment`.
 * @param props - Props object; `children` is split out and normalized.
 * @returns A plain `{ type, props, children }` descriptor.
 *
 * @example
 * ```tsx
 * // tsconfig: { "jsx": "react-jsx", "jsxImportSource": "threejs-scenes/jsx" }
 * const tree = <mesh geometry={box} material={mat} position={[0, 1, 0]} />
 * ```
 */
export function jsx (type: ElementType, props: Record<string, unknown> | null): SceneElement {
  const { children, ...rest } = props ?? {}
  return { type, props: rest, children: normalizeChildren(children) }
}

/** Static-children variant of `jsx` — identical here (children are plain arrays either way). */
export const jsxs = jsx
/** Dev-transform variant of `jsx` — identical; no dev-mode bookkeeping is kept. */
export const jsxDEV = jsx

/** Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed. */
export function h (type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement {
  const childList = children.length ? children : normalizeChildren(props?.children)
  const rest      = { ...props }
  delete rest.children
  return { type, props: rest, children: childList }
}
