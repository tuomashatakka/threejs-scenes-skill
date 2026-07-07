// lib/jsx/jsx-runtime.ts
// JSX runtime. `jsx`/`jsxs` are what a `react-jsx`-style transpile calls;
// `h` is the hyperscript form so you can build the same trees WITHOUT a build
// step (handy for CDN/artifact usage). Both produce plain SceneElement
// descriptors — no work happens until render() walks the tree.
export const Fragment = Symbol('jsx.Fragment');
function normalizeChildren(children) {
    if (children === undefined || children === null)
        return [];
    return (Array.isArray(children) ? children : [children]);
}
export function jsx(type, props) {
    const { children, ...rest } = props ?? {};
    return { type, props: rest, children: normalizeChildren(children) };
}
export const jsxs = jsx;
export const jsxDEV = jsx;
/** Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed. */
export function h(type, props, ...children) {
    const childList = children.length ? children : normalizeChildren(props?.children);
    const rest = { ...props };
    delete rest.children;
    return { type, props: rest, children: childList };
}
//# sourceMappingURL=jsx-runtime.js.map