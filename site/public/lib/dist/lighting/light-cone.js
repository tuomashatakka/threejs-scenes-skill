// lib/lighting/light-cone.ts
// Visible volumetric light shaft, ported from anime-anima. An open additive
// cone whose brightness falls off along its length and rises at the rim
// (view-angle fresnel) — reads as a theatrical beam without any raymarching.
import * as THREE from 'three';
export function createLightCone(from, to, { color = 0xffffff, spread = 0.16 } = {}) {
    const height = from.distanceTo(to);
    const radius = height * spread;
    const geometry = new THREE.ConeGeometry(radius, height, 40, 1, true);
    geometry.translate(0, -height / 2, 0);
    const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
            uColor: { value: new THREE.Color(color) },
            uHeight: { value: height },
        },
        vertexShader: /* glsl */ `
      varying float vT;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      uniform float uHeight;
      void main() {
        vT = -position.y / uHeight;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalV = normalize(normalMatrix * normal);
        vViewDir = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
        fragmentShader: /* glsl */ `
      varying float vT;
      varying vec3 vNormalV;
      varying vec3 vViewDir;
      uniform vec3 uColor;
      void main() {
        float rim = pow(1.0 - abs(dot(normalize(vNormalV), normalize(vViewDir))), 1.5);
        float vertical = pow(1.0 - clamp(vT, 0.0, 1.0), 1.15);
        // Additive: keep alpha = 1 and put all brightness in rgb (avoids an a^2 falloff).
        float a = vertical * (0.16 + 0.6 * rim);
        gl_FragColor = vec4(uColor * a * 1.7, 1.0);
      }
    `,
    });
    const cone = new THREE.Mesh(geometry, material);
    cone.position.copy(from);
    cone.lookAt(to);
    cone.rotateX(-Math.PI / 2);
    return cone;
}
// perf: cheap. One open cone, 40 segments, additive — no depth writes, no
// raymarch. Dispose geometry + material when removing.
//# sourceMappingURL=light-cone.js.map