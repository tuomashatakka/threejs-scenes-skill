import type { SelectiveBloomOptions, SelectiveBloomHandle } from './bloom-selective.js';
import type { WebGlPassContext } from './types.js';
export interface EmissiveBloomOptions extends SelectiveBloomOptions {
    emissiveThreshold?: number;
}
export declare function createEmissiveBloom(ctx: WebGlPassContext, options?: EmissiveBloomOptions): SelectiveBloomHandle;
//# sourceMappingURL=bloom-emissive.d.ts.map