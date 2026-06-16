// lib/jsx/reconciler.ts
// Tree walker. Turns a SceneElement tree into real three objects parented under
// the scene, splitting each prop into static (applied once) or reactive (a
// function — re-read and re-applied every frame by the render loop). Function
// components are invoked and their output mounted; Fragments are transparent.
// There is no virtual DOM diff: reconciliation happens by re-evaluating reactive
// props on the frame tick (see render.ts), which is the whole point — the loop
// IS the scheduler.
import { Fragment } from './jsx-runtime.js';
import { createHost, RAW_FUNCTION_PROPS } from './components.js';
function isReactive(name, value) {
    return typeof value === 'function' && !name.startsWith('on') && !RAW_FUNCTION_PROPS.has(name);
}
function mountChild(child, container, rt) {
    if (child === null || child === undefined || typeof child === 'boolean')
        return;
    if (Array.isArray(child)) {
        for (const c of child)
            mountChild(c, container, rt);
        return;
    }
    if (typeof child === 'string' || typeof child === 'number')
        return; // 3D scenes have no text nodes
    mountElement(child, container, rt);
}
function mountElement(el, container, rt) {
    const { type, props, children } = el;
    if (type === Fragment) {
        for (const c of children)
            mountChild(c, container, rt);
        return;
    }
    if (typeof type === 'function') {
        const out = type({ ...props, children });
        if (Array.isArray(out))
            for (const c of out)
                mountChild(c, container, rt);
        else
            mountChild(out, container, rt);
        return;
    }
    const host = createHost(type, props, rt);
    for (const [name, value] of Object.entries(props))
        if (isReactive(name, value)) {
            const get = value;
            host.setProp(name, get());
            rt.addReactive({ get, apply: v => host.setProp(name, v) });
        }
        else
            host.setProp(name, value);
    if (host.object && container && host.object !== container)
        container.add(host.object);
    rt.addDisposer(host.dispose);
    const childContainer = host.container ?? container;
    for (const c of children)
        mountChild(c, childContainer, rt);
}
/** Mount a tree under the runtime's scene. Entry point used by render(). */
export function mountTree(root, rt) {
    mountChild(root, rt.scene, rt);
}
// perf: mount is one-off. Per frame the loop applies only the reactive bindings
// (one accessor call + one setProp each) — keep reactive props to what truly
// changes; static props cost nothing after mount.
//# sourceMappingURL=reconciler.js.map