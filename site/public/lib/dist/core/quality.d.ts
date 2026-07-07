import type { QualityPreset, QualitySettings, QualityTier } from '../types.js';
export declare const QUALITY_PRESETS: Record<QualityTier, QualityPreset>;
export declare function detectTier(): QualityTier;
export declare function getQualitySettings(tier?: QualityTier): QualitySettings;
//# sourceMappingURL=quality.d.ts.map