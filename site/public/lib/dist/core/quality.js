// lib/core/quality.ts
// Detect device tier at boot. Use to gate shadow resolution, post-fx, chunk
// view radius, particle counts, etc. Ported from scripts/quality-tier.js.
export const QUALITY_PRESETS = {
    mobile: {
        pixelRatio: 1.5,
        shadowMapSize: 1024,
        shadowsEnabled: true,
        postFx: ['bloom'],
        chunkViewRadius: 2,
        particleBudget: 5000,
        maxLights: 2,
    },
    desktop: {
        pixelRatio: 2.0,
        shadowMapSize: 2048,
        shadowsEnabled: true,
        postFx: ['bloom', 'dof', 'filmGrain'],
        chunkViewRadius: 4,
        particleBudget: 50000,
        maxLights: 4,
    },
    highEnd: {
        pixelRatio: 2.0,
        shadowMapSize: 4096,
        shadowsEnabled: true,
        postFx: ['bloom', 'dof', 'godRays', 'filmGrain', 'glitch'],
        chunkViewRadius: 6,
        particleBudget: 250000,
        maxLights: 8,
    },
};
export function detectTier() {
    const isMobile = navigator.maxTouchPoints > 0 && window.innerWidth < 1280;
    const cores = navigator.hardwareConcurrency || 4;
    const dpr = window.devicePixelRatio || 1;
    if (isMobile || cores <= 4)
        return 'mobile';
    if (cores >= 8 && dpr >= 2)
        return 'highEnd';
    return 'desktop';
}
export function getQualitySettings(tier = detectTier()) {
    return { tier, ...QUALITY_PRESETS[tier] };
}
// perf: cheap. Run once at boot.
//# sourceMappingURL=quality.js.map