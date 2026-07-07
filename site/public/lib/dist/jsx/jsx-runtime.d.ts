export type ComponentFn = (props: Record<string, unknown>) => SceneElement | SceneElement[] | null;
export type ElementType = string | ComponentFn | typeof Fragment;
export interface SceneElement {
    type: ElementType;
    props: Record<string, unknown>;
    children: SceneChild[];
}
export type SceneChild = SceneElement | string | number | boolean | null | undefined | SceneChild[];
export declare const Fragment: unique symbol;
export declare function jsx(type: ElementType, props: Record<string, unknown> | null): SceneElement;
export declare const jsxs: typeof jsx;
export declare const jsxDEV: typeof jsx;
/** Hyperscript builder — `h(Light, { type: 'spot' })`, no transpile needed. */
export declare function h(type: ElementType, props: Record<string, unknown> | null, ...children: SceneChild[]): SceneElement;
//# sourceMappingURL=jsx-runtime.d.ts.map