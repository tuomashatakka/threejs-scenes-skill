// lib/post/stereoscopy.ts
// Stereo render modes. AnaglyphEffect for red/cyan glasses, StereoEffect for
// cardboard-style side-by-side. Both bypass EffectComposer — pick one mode per
// session. Ported from scripts/stereoscopy.js.
import { AnaglyphEffect } from 'three/addons/effects/AnaglyphEffect.js';
import { StereoEffect } from 'three/addons/effects/StereoEffect.js';
export function createStereoRenderer(renderer, mode, { width, height } = {}) {
    if (mode === 'anaglyph') {
        const fx = new AnaglyphEffect(renderer);
        if (width && height)
            fx.setSize(width, height);
        return {
            mode: 'anaglyph',
            render: (scene, camera) => fx.render(scene, camera),
            setSize: (w, h) => fx.setSize(w, h),
            dispose: () => fx.dispose?.(),
        };
    }
    if (mode === 'stereo') {
        const fx = new StereoEffect(renderer);
        if (width && height)
            fx.setSize(width, height);
        return {
            mode: 'stereo',
            render: (scene, camera) => fx.render(scene, camera),
            setSize: (w, h) => fx.setSize(w, h),
            dispose: () => { },
        };
    }
    return {
        mode: 'off',
        render: (scene, camera) => renderer.render(scene, camera),
        setSize: (w, h) => renderer.setSize(w, h),
        dispose: () => { },
    };
}
// perf: doubles render cost (two eyes). Combine with stereo + post-fx only on
// desktop / high-end tier.
//# sourceMappingURL=stereoscopy.js.map