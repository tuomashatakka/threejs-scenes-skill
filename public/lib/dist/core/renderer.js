// lib/core/renderer.ts
// WebGLRenderer factory. Caps pixel ratio at 2, sets sane defaults for color
// space, tone mapping, and shadows. Ported from scripts/renderer-setup.js.
import * as THREE from 'three';
export function createRenderer({ canvas, antialias = true, pixelRatioMax = 2, shadows = true, toneMapping = THREE.ACESFilmicToneMapping, toneMappingExposure = 1, }) {
    const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias,
        alpha: false,
        powerPreference: 'high-performance',
        stencil: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioMax));
    const parent = canvas.parentElement ?? document.body;
    renderer.setSize(parent.clientWidth, parent.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = toneMapping;
    renderer.toneMappingExposure = toneMappingExposure;
    if (shadows) {
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    return renderer;
}
export function attachResizeObserver(renderer, camera, canvas, onResize) {
    const ro = new ResizeObserver(entries => {
        const entry = entries[0];
        if (!entry)
            return;
        const { width, height } = entry.contentRect;
        renderer.setSize(width, height, false);
        if (camera.isPerspectiveCamera) {
            const perspective = camera;
            perspective.aspect = width / height;
            perspective.updateProjectionMatrix();
        }
        onResize?.(width, height);
    });
    ro.observe(canvas.parentElement ?? document.body);
    return () => ro.disconnect();
}
// perf: cheap. one renderer instance per scene, never recreated.
//# sourceMappingURL=renderer.js.map