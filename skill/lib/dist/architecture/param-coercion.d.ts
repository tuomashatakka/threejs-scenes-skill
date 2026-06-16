import type { ParamSpec, ParamSpecMap, ParamValue } from '../types.js';
export declare function resolveParam(spec: ParamSpec, given: unknown): ParamValue;
export declare function resolveParams(specs: ParamSpecMap, given?: Record<string, unknown>): Record<string, ParamValue>;
//# sourceMappingURL=param-coercion.d.ts.map