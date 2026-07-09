// lib/lighting/light-cone.ts
// Visible volumetric light shaft, ported from anime-anima. An open additive
// cone whose brightness falls off along its length and rises at the rim
// (view-angle fresnel) — reads as a theatrical beam without any raymarching.

import * as THREE from 'three'


/** Options for {@link createLightCone}: beam color and base-radius `spread`. */
export interface LightConeOptions {
  color?: THREE.ColorRepresentation

  /** Cone base radius as a fraction of its length. Default 0.16. */
  spread?: number
}

/**
 * Fake volumetric light shaft: an open additive-blended cone from `from` to
 * `to` whose shader fades toward the base and edges. Pure mesh — no real
 * volumetrics, no shadowing, very cheap.
 *
 * @param from - Apex (the light source position).
 * @param to - Where the beam lands; sets length and orientation.
 * @param options - Color and spread.
 * @returns The cone mesh; dispose its geometry/material when done.
 */
export function createLightCone (
  from: THREE.Vector3,
  to: THREE.Vector3,
  { color = 0xffffff, spread = 0.16 }: LightConeOptions = {},
): THREE.Mesh {
  const height   = from.distanceTo(to)
  const radius   = height * spread
  const geometry = new THREE.ConeGeometry(radius, height, 40, 1, true)
  geometry.translate(0, -height / 2, 0)

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite:  false,
    blending:    THREE.AdditiveBlending,
    side:        THREE.DoubleSide,
    uniforms:    {
      uColor:  { value: new THREE.Color(color) },
      uHeight: { value: height },
    },
    vertexShader: /* glsl */`
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
    fragmentShader: /* glsl */`
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
  })

  const cone = new THREE.Mesh(geometry, material)
  cone.position.copy(from)
  cone.lookAt(to)
  cone.rotateX(-Math.PI / 2)
  return cone
}

// perf: cheap. One open cone, 40 segments, additive — no depth writes, no
// raymarch. Dispose geometry + material when removing.
