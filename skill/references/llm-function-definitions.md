# LLM Function Definitions

Gemini / ai-sdk tool schemas for procedural three.js scene generation.

## Stack

- **Vercel AI SDK** (`ai`) for `generateObject` and `tool` definitions.
- **`@ai-sdk/google`** for Gemini access.
- **`zod`** for runtime schema validation.

## Why Function Calling Beats Free-Form Generation

LLMs are stochastic. Asking "give me three.js code for a forest" produces
different output every time — sometimes broken. Function tools constrain the
output to a typed schema, so the LLM's job becomes filling structured fields.
The codegen runner then turns those fields into deterministic JavaScript.

Same prompt + same seed = same code. Always.

## Tool Catalog

All implementations live in `scripts/llm-functions.js`. Six tools, ranked by
how often you'll reach for them:

| Tool | Purpose |
|------|---------|
| `planScene` | Convert a brief into a structured scene plan (camera, lighting, features, effects, perf tier) |
| `generateInstancePlacement` | Placement config for instanced decoration fields (trees, rocks, props) |
| `generateShaderRecipe` | Shader material recipe with named uniforms and GLSL node assignments |
| `generateVoxelLevel` | Layered voxel level rules with per-layer deterministic params |
| `generateTextureRecipe` | Procedural texture recipe (DataTexture or OffscreenCanvas) |
| `designEffectChain` | Post-processing pass order and uniform values tuned to a mood + perf tier |

## Determinism Contract

Every tool's input schema includes:

- A natural-language brief.
- Optional constraints (perf tier, size, mood, count).

Every tool's output schema includes:

- Enough structured data that a deterministic codegen script can produce
  identical JavaScript from it.
- A `seed: number` field for any randomness the consumer applies.
- A `notes: string` field for free-form rendering hints the codegen script
  can interpret.

## Calling Pattern

```js
import { sceneTools } from './llm-functions.js'

const plan = await sceneTools.planScene.execute({
  brief: 'foggy emo forest at dusk with floating runes',
  targetFps: 60,
})

// plan is now { title, camera, lighting, background, effects, features, perfTier }
```

## Streaming Agent Loop

For multi-step generation (plan → fill in each feature), use ai-sdk's
`generateText` with `tools: sceneTools` and let the agent call multiple tools
in sequence:

```js
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { sceneTools } from './llm-functions.js'

const { toolCalls, toolResults } = await generateText({
  model: google('gemini-2.5-pro'),
  tools: sceneTools,
  maxToolRoundtrips: 6,
  system: `You are a three.js scene architect. Plan first, then fill in each feature.`,
  prompt: 'Build me a cozy isometric village at sunset.',
})

// toolResults is now the structured outputs of every tool the agent invoked
```

## Codegen Runner

See `scripts/codegen-runner.js` for the entry script. Usage:

```bash
node src/llm/codegen/run.js planScene "foggy emo forest at dusk"
```

The runner:

1. Calls the named tool with the prompt.
2. Validates the output against the tool's zod schema.
3. Writes `src/generated/<task>.json` (raw output) and
   `src/generated/<task>.meta.json` (prompt, seed, model id).
4. Optionally invokes a template renderer that emits real `.js` files from
   the structured output (e.g. converting a shader recipe to a working
   `createMaterial` factory).
5. Runs `eslint --fix` on the emitted file.

## Validation

Every output is validated with `zod.parse(toolSchema, output)`. Invalid
outputs throw — no garbage reaches the file system. The schema also doubles
as documentation: the LLM sees the schema in the tool description.

## Cost-Conscious Usage

- **Cache plans aggressively.** `planScene` outputs are stable across runs
  for the same brief — cache by hash of brief + targetFps.
- **Batch feature generation.** When the plan has 6 features, generate
  shaders/placements for all 6 in one streaming pass rather than 6 separate
  calls.
- **Use `gemini-2.5-flash` for low-stakes tools** (texture recipes,
  placement configs) and reserve `gemini-2.5-pro` for plan + shader recipes
  where correctness matters more.

## Embedding LLM-Generated Output in Artifacts

For live artifacts that need on-the-fly scene generation, run the LLM call
from within the artifact using the **Anthropic API in Artifacts** feature
(or equivalent endpoint exposed by the host). The artifact:

1. Sends the user's natural-language brief to the API.
2. Receives structured JSON matching one of the schemas.
3. Parses with the schema's runtime validator (zod or hand-rolled
   `JSON.parse` + property checks).
4. Feeds the structured fields into the matching factory script
   (`createInstancedField(config)`, `createMaterialFromRecipe(recipe)`,
   etc.).

Keep the schemas small enough to fit in a single API response —
`generateShaderRecipe` and `generateInstancePlacement` are designed for this.
`planScene` is borderline; split it into smaller calls for an in-artifact
agent.

## Common Pitfalls

- Asking the LLM to emit raw GLSL strings — they break compile silently.
  Use the recipe pattern instead, then deterministically render to GLSL.
- Forgetting to embed seed + model id in the emitted file — the artifact
  becomes un-reproducible.
- Letting the LLM choose data structures freely — wrap every output in a
  zod schema or it WILL drift between calls.
- Calling `generateObject` without a `system` prompt — Gemini will be
  helpful instead of disciplined; the system prompt is where you enforce
  "output only structured data".
- Using `maxToolRoundtrips` without a ceiling — agent loops can run away.
  Cap at 6–10.
