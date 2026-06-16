import type { PropContext, PropFactory, PropInstance } from '../types.js';
export declare function registerProp(name: string, factory: PropFactory): void;
export declare function getProp(name: string): PropFactory | undefined;
export declare function resolveProp(src: PropFactory | string, ctx?: PropContext): Promise<PropInstance>;
//# sourceMappingURL=registry.d.ts.map