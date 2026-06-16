// scripts/codegen-runner.js
// CLI entrypoint for procedural codegen.
//   node scripts/codegen-runner.js <task> <brief>
// Writes src/generated/<task>.json (output) + .meta.json (prompt, seed, model).
// For shader/voxel/texture recipes, optionally invokes a template renderer
// that emits a working .js factory.

import { writeFile, mkdir } from 'node:fs/promises'
import { execSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'

import { sceneTools } from './llm-functions.js'

const MODEL_ID = 'gemini-2.5-pro'
const SCHEMA_VERSION = 1

async function main () {
  const [, , task, ...briefParts] = process.argv
  const brief = briefParts.join(' ')

  if (!task || !(task in sceneTools)) {
    console.error('Usage: node codegen-runner.js <task> <brief>')
    console.error(`Tasks: ${Object.keys(sceneTools).join(', ')}`)
    process.exit(1)
  }

  const t = sceneTools[task]
  // each tool has its own parameter shape; we pass brief as the most likely
  // field name. Adjust per task as needed.
  const params = guessParams(task, brief)

  console.log(`▸ running ${task} with model ${MODEL_ID}`)
  const result = await t.execute(params, {})

  const outDir = resolve('src/generated')
  await mkdir(outDir, { recursive: true })

  const outPath = resolve(outDir, `${task}.json`)
  const metaPath = resolve(outDir, `${task}.meta.json`)
  await writeFile(outPath, JSON.stringify(result, null, 2))
  await writeFile(metaPath, JSON.stringify({
    task,
    brief,
    params,
    model: MODEL_ID,
    schemaVersion: SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
  }, null, 2))

  try {
    execSync(`eslint --fix ${outPath}`, { stdio: 'inherit' })
  } catch {
    // eslint may not be configured for JSON; ignore failure
  }

  console.log(`✓ wrote ${outPath}`)
  console.log(`✓ wrote ${metaPath}`)
}

function guessParams (task, brief) {
  switch (task) {
    case 'planScene':                 return { brief, targetFps: 60 }
    case 'generateInstancePlacement': return { purpose: brief, area: '50x50 ground plane', density: 'medium' }
    case 'generateShaderRecipe':      return { brief, mood: 'organic', animated: true }
    case 'generateVoxelLevel':        return { theme: brief, scale: 'medium' }
    case 'generateTextureRecipe':     return { purpose: brief, mood: 'organic' }
    case 'designEffectChain':         return { mood: brief, perfTier: 'desktop' }
    default:                          return { brief }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// perf: not a render-loop concern. One-shot CLI tool.
