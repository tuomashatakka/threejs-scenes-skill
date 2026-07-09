// lib/core/quality.ts
// Detect device tier at boot. Use to gate shadow resolution, post-fx, chunk
// view radius, particle counts, etc. Ported from scripts/quality-tier.js.

import type { QualityPreset, QualitySettings, QualityTier } from '../types.js'


/**
 * Baseline render budgets per {@link QualityTier}: pixel ratio, shadow map
 * size, post-fx list, chunk view radius, particle budget, and light count.
 * Spread and override to customize; resolve via {@link getQualitySettings}.
 */
export const QUALITY_PRESETS: Record<QualityTier, QualityPreset> = {
  mobile: {
    pixelRatio:      1.5,
    shadowMapSize:   1024,
    shadowsEnabled:  true,
    postFx:          [ 'bloom' ],
    chunkViewRadius: 2,
    particleBudget:  5000,
    maxLights:       2,
  },
  desktop: {
    pixelRatio:      2.0,
    shadowMapSize:   2048,
    shadowsEnabled:  true,
    postFx:          [ 'bloom', 'dof', 'filmGrain' ],
    chunkViewRadius: 4,
    particleBudget:  50000,
    maxLights:       4,
  },
  highEnd: {
    pixelRatio:      2.0,
    shadowMapSize:   4096,
    shadowsEnabled:  true,
    postFx:          [ 'bloom', 'dof', 'godRays', 'filmGrain', 'glitch' ],
    chunkViewRadius: 6,
    particleBudget:  250000,
    maxLights:       8,
  },
}

/**
 * Detect the device quality tier from cheap navigator/window heuristics.
 * `'mobile'` when touch-capable and narrower than 1280px, or 4 cores or fewer;
 * `'highEnd'` with 8+ cores and a devicePixelRatio of 2+; `'desktop'`
 * otherwise. Run once at boot — requires a browser environment.
 */
export function detectTier (): QualityTier {
  const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 1280
  const cores    = navigator.hardwareConcurrency || 4
  const dpr      = window.devicePixelRatio || 1
  if (isMobile || cores <= 4)
    return 'mobile'
  if (cores >= 8 && dpr >= 2)
    return 'highEnd'
  return 'desktop'
}

/**
 * Resolve the preset for a tier into a {@link QualitySettings} object with the
 * tier attached. Defaults to the auto-detected tier from {@link detectTier}.
 */
export function getQualitySettings (tier: QualityTier = detectTier()): QualitySettings {
  return { tier, ...QUALITY_PRESETS[tier] }
}

// perf: cheap. Run once at boot.
