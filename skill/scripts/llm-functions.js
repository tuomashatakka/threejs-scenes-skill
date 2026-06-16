// scripts/llm-functions.js
// AI-SDK tool definitions for procedural three.js scene generation.
// Each tool wraps a zod schema and a generateObject call against Gemini.
// Outputs are deterministic given the same brief + seed + model id.

import { z } from 'zod'
import { tool, generateObject } from 'ai'
import { google } from '@ai-sdk/google'

// shared primitives
const vec3Schema = z.tuple([ z.number(), z.number(), z.number() ])
const colorHex   = z.string().regex(/^#[0-9a-fA-F]{6}$/)
const seedSchema = z.number().int()

// --- 1. plan scene ----------------------------------------------------------
export const scenePlanSchema = z.object({
  title:      z.string(),
  camera:     z.enum([ 'iso-true', 'iso-dimetric', 'perspective-follow', 'orbital', 'first-person' ]),
  lighting:   z.enum([ 'ibl-only', 'ibl-plus-sun', 'three-point', 'stylized-rim' ]),
  background: z.enum([ 'solid', 'gradient', 'env-map', 'skybox-procedural' ]),
  effects:    z.array(z.enum([
    'bloom', 'god-rays', 'dof', 'film-grain', 'glitch',
    'chromatic-aberration', 'stereoscopy',
  ])),
  features: z.array(z.object({
    name: z.string(),
    kind: z.enum([
      'terrain', 'voxel-world', 'instanced-decoration',
      'particle-system', 'billboard-cloud', 'hero-mesh', 'hud-element',
    ]),
    description:   z.string(),
    countEstimate: z.number().int()
      .positive()
      .optional(),
  })),
  perfTier: z.enum([ 'mobile', 'desktop', 'high-end' ]),
})

export const planSceneTool = tool({
  description: 'Plan a three.js scene composition from a natural-language brief. Returns a structured plan with camera, lighting, features, and effect chain.',
  parameters:  z.object({
    brief:     z.string().describe('user description of desired scene'),
    targetFps: z.number().int()
      .min(30)
      .max(120)
      .default(60),
  }),
  execute: async ({ brief, targetFps }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: scenePlanSchema,
      system: 'You plan vanilla three.js scenes. Output structured JSON only. Be conservative on mobile perfTier.',
      prompt: `Brief: ${brief}\nTarget framerate: ${targetFps}fps. Plan the scene.`,
    })
    return object
  },
})

// --- 2. instance placement --------------------------------------------------
export const instancePlacementSchema = z.object({
  seed:  seedSchema,
  count: z.number().int()
    .positive(),
  pattern:    z.enum([ 'poisson-disk', 'grid-jittered', 'spiral', 'voronoi-relaxed', 'noise-thresholded' ]),
  bounds:     z.object({ min: vec3Schema, max: vec3Schema }),
  rotation:   z.enum([ 'none', 'random-y', 'aligned-to-slope', 'random-all' ]),
  scaleRange: z.tuple([ z.number().positive(), z.number().positive() ]),
  notes:      z.string().describe('rendering hints — e.g. "use InstancedMesh with shared trunk material"'),
})

export const generateInstancePlacementTool = tool({
  description: 'Generate placement config for an instanced decoration field (trees, rocks, props). Returns parameters consumed by createInstancedField factory.',
  parameters:  z.object({
    purpose: z.string().describe('e.g. "forest understory", "asteroid belt", "city props"'),
    area:    z.string().describe('"50x50 ground plane", "spherical shell of radius 100", etc.'),
    density: z.enum([ 'sparse', 'medium', 'dense', 'overgrown' ]),
  }),
  execute: async ({ purpose, area, density }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: instancePlacementSchema,
      system: 'You produce three.js InstancedMesh placement configs. Bias toward Poisson disk for naturalistic distribution.',
      prompt: `Purpose: ${purpose}\nArea: ${area}\nDensity: ${density}`,
    })
    return object
  },
})

// --- 3. shader recipe -------------------------------------------------------
export const shaderRecipeSchema = z.object({
  name:         z.string(),
  category:     z.enum([ 'surface', 'post', 'particle', 'vertex-displacement' ]),
  baseMaterial: z.enum([ 'MeshStandardMaterial', 'MeshBasicMaterial', 'ShaderMaterial' ]),
  uniforms:     z.array(z.object({
    name:    z.string(),
    type:    z.enum([ 'float', 'vec2', 'vec3', 'vec4', 'color' ]),
    default: z.union([ z.number(), z.array(z.number()), colorHex ]),
  })),
  nodes: z.array(z.object({
    slot: z.enum([ 'fragmentMain', 'vertexMain', 'fragmentColor', 'vertexPosition', 'fragmentAlpha' ]),
    glsl: z.string().describe('GLSL snippet — uses declared uniforms, vUv, vWorldPosition, etc.'),
  })),
  description: z.string(),
})

export const generateShaderRecipeTool = tool({
  description: 'Design a ShaderMaterial recipe for a given visual brief. Returns a structured recipe; codegen script renders it into a JavaScript factory.',
  parameters:  z.object({
    brief:    z.string(),
    mood:     z.enum([ 'organic', 'crystalline', 'liquid', 'holographic', 'corrupted', 'dreamy', 'industrial' ]),
    animated: z.boolean().default(true),
  }),
  execute: async ({ brief, mood, animated }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: shaderRecipeSchema,
      system: 'You design composable ShaderMaterial recipes for three.js. Reference only standard varyings (vUv, vWorldPosition, vNormal) and the declared uniforms. Output safe GLSL ES 1.00 fragments.',
      prompt: `Brief: ${brief}\nMood: ${mood}\nAnimated: ${animated}`,
    })
    return object
  },
})

// --- 4. voxel level ---------------------------------------------------------
export const voxelLevelSchema = z.object({
  chunkSize: z.number().int()
    .min(8)
    .max(64),
  worldChunks: z.tuple([ z.number().int(), z.number().int(), z.number().int() ]),
  seed:        seedSchema,
  layers:      z.array(z.object({
    name:       z.string(),
    rule:       z.enum([ 'heightmap-noise', 'cave-carve-3d', 'flood-fill-water', 'tower-prefab', 'scatter-prop' ]),
    paramsJson: z.string().describe('rule-specific parameters as JSON string'),
    voxelId:    z.number().int()
      .min(1)
      .max(65535),
  })),
})

export const generateVoxelLevelTool = tool({
  description: 'Lay out a voxel level as a stack of generative rules. The codegen script executes the rules to populate VoxelChunk data.',
  parameters:  z.object({
    theme: z.string(),
    scale: z.enum([ 'cozy', 'medium', 'epic' ]),
  }),
  execute: async ({ theme, scale }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: voxelLevelSchema,
      system: 'You design layered voxel level generators. Each layer is a deterministic rule on a shared chunk array.',
      prompt: `Theme: ${theme}\nScale: ${scale}`,
    })
    return object
  },
})

// --- 5. procedural texture --------------------------------------------------
export const proceduralTextureSchema = z.object({
  size: z.number().int()
    .refine(n => (n & n - 1) === 0, 'must be power of two'),
  channels:   z.enum([ 'r', 'rg', 'rgb', 'rgba' ]),
  algorithm:  z.enum([ 'fbm', 'worley', 'flow-curl', 'voronoi-edges', 'gradient-noise', 'reaction-diffusion', 'palette-lookup' ]),
  params:     z.record(z.string(), z.number()),
  seed:       seedSchema,
  tileable:   z.boolean(),
  colorSpace: z.enum([ 'srgb', 'linear' ]),
})

export const generateTextureRecipeTool = tool({
  description: 'Recipe for a programmatic texture (DataTexture or OffscreenCanvas). Codegen emits a generator function.',
  parameters:  z.object({
    purpose: z.string(),
    mood:    z.string(),
  }),
  execute: async ({ purpose, mood }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: proceduralTextureSchema,
      system: 'You design seamless procedural textures for three.js. Bias toward FBM and Worley for natural feel.',
      prompt: `Purpose: ${purpose}\nMood: ${mood}`,
    })
    return object
  },
})

// --- 6. effect chain --------------------------------------------------------
export const passChainSchema = z.object({
  passes: z.array(z.object({
    kind: z.enum([
      'render', 'bloom', 'god-rays', 'dof', 'glitch-rgb', 'glitch-block',
      'glitch-scan', 'chromatic-aberration', 'film-grain', 'hud-beam', 'output',
    ]),
    enabled:  z.boolean(),
    uniforms: z.record(z.string(), z.union([ z.number(), z.array(z.number()), colorHex ])),
  })),
  rationale: z.string(),
})

export const designEffectChainTool = tool({
  description: 'Design a post-processing chain matching a target mood and perf tier.',
  parameters:  z.object({
    mood:     z.string(),
    perfTier: z.enum([ 'mobile', 'desktop', 'high-end' ]),
  }),
  execute: async ({ mood, perfTier }) => {
    const { object } = await generateObject({
      model:  google('gemini-2.5-pro'),
      schema: passChainSchema,
      system: 'You design post-processing chains for three.js. Order: render → world-space fx → optical fx → grain/glitch → output. Disable expensive passes on mobile.',
      prompt: `Mood: ${mood}\nPerf tier: ${perfTier}`,
    })
    return object
  },
})

// bundle exposed for streaming agent loops
export const sceneTools = {
  planScene:                 planSceneTool,
  generateInstancePlacement: generateInstancePlacementTool,
  generateShaderRecipe:      generateShaderRecipeTool,
  generateVoxelLevel:        generateVoxelLevelTool,
  generateTextureRecipe:     generateTextureRecipeTool,
  designEffectChain:         designEffectChainTool,
}

// perf: not a render-loop concern. LLM calls are async. Cache outputs by hash
// of brief for determinism and cost.
