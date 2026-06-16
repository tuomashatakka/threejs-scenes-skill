import type { PropContext, PropDefinition, PropFactory, PropInstance } from '../types.js';
/** Validate + tag a prop definition. The returned factory is what <Prop src> resolves to. */
export declare function defineProp(def: PropDefinition): PropFactory;
export interface CreatePropOptions {
    /** Auto-play every clip on mount (looping). Default true. */
    autoplay?: boolean;
}
export declare function createProp(factory: PropFactory, ctx?: PropContext, options?: CreatePropOptions): PropInstance;
//# sourceMappingURL=prop.d.ts.map