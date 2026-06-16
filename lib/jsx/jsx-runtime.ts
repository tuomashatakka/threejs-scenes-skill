// lib/jsx/jsx-runtime.ts
// JSX runtime. `jsx`/`jsxs` are what a `react-jsx`-style transpile calls;
// `h` is the hyperscript form so you can build the same trees WITHOUT a build
// step (handy for CDN/artifact usage). Both produce plain SceneElement
// descriptors — no work happens until render() walks the tree.

export type ComponentFn = (props: Record<string, unknown>) => SceneElement | SceneElement[] | null
export type ElementType = string | ComponentFn | typeof Fragment

export interface SceneElement {
  type:     ElementType
  props:    Record<string, unknown>
  children: SceneChild[]
}

export type SceneChild = SceneElement | string | number | boolean | null | undefined | SceneChild[]

export const Fragment = Symbol('jsx.Fragment')

function normalizeChildren (children: unknown): SceneChild[] {
  if (children === undefined || children === null)
    return []
  return (Array.isArray(children) ? children : [ children ]) as SceneChild[]
}

export function jsx (type: ElementType, props: Record<string, unknown> | null): SceneElement {
  const { children, ...rest } = props ?? {}
  return { type, props: rest, children: normalizeChildren(children) }
}

export const jsxs = jsx
export const jsxDEV = jsx

/** Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed. */
export function h (type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement {
  const childList = children.length ? children : normalizeChildren(props?.children)
  const rest      = { ...props }
  delete rest.children
  return { type, props: rest, children: childList }
}
