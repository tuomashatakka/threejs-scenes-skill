// lib/architecture/param-coercion.ts
// Param coercion for config- or LLM-driven content. Coerce, never throw:
// clamp numbers to [min, max], validate enums against their option list, and
// fall back to the default for anything malformed. LLM-emitted JSON with a bad
// knob degrades to a sane default instead of exploding (production-lessons.md).

import type { ParamSpec, ParamSpecMap, ParamValue } from '../types.js'


function clamp (n: number, min: number | undefined, max: number | undefined): number {
  let v = n
  if (min !== undefined && v < min)
    v = min
  if (max !== undefined && v > max)
    v = max
  return v
}

export function resolveParam (spec: ParamSpec, given: unknown): ParamValue {
  switch (spec.kind) {
    case 'number': {
      const n = typeof given === 'number' && Number.isFinite(given) ? given : spec.default
      return clamp(n, spec.min, spec.max)
    }
    case 'int': {
      const n = typeof given === 'number' && Number.isFinite(given) ? Math.round(given) : spec.default
      return clamp(n, spec.min, spec.max)
    }
    case 'boolean':
      return typeof given === 'boolean' ? given : spec.default
    case 'string':
      return typeof given === 'string' ? given : spec.default
    case 'enum':
      return typeof given === 'string' && spec.options.includes(given) ? given : spec.default
    default:
      // exhaustiveness: unreachable for known kinds.
      return (spec as ParamSpec).default
  }
}

export function resolveParams (
  specs: ParamSpecMap,
  given: Record<string, unknown> = {},
): Record<string, ParamValue> {
  const out: Record<string, ParamValue> = {}
  for (const key in specs) {
    const spec = specs[key]
    if (spec)
      out[key] = resolveParam(spec, given[key])
  }
  return out
}

// perf: cheap. one pass over the spec map; never throws.
